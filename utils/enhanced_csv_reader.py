import pandas as pd
import csv
import json
import sys
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
import warnings
import re
warnings.filterwarnings('ignore')

def is_identifier_col(col_name):
    col_lower = col_name.lower()
    return any(keyword in col_lower for keyword in ['id', 'student_id', 'studentid', 'name', 'email'])

def find_metric_key(perf_metrics, candidates):
    # case-insensitive search for a metric key among perf_metrics
    for cand in candidates:
        for k in perf_metrics.keys():
            if cand.lower() == k.lower():
                return k
    return None

# --- Read input CSV ---
if len(sys.argv) < 2:
    print("Usage: python script.py <data.csv>", file=sys.stderr)
    sys.exit(1)

file_path = sys.argv[1]
df = pd.read_csv(file_path)

# Identify identifier columns that shouldn't be analyzed
identifier_columns = []
for col in df.columns:
    if is_identifier_col(col):
        identifier_columns.append(col)

print(f"Identifier columns excluded from analysis: {identifier_columns}", file=sys.stderr)

# Convert to list of dictionaries for original data (preserve original)
data = df.to_dict('records')

# Enhanced data processing - add email detection and validation
processed_data = []
email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
for row in data:
    processed_row = dict(row)
    for col in df.columns:
        if 'email' in col.lower() and pd.notna(row.get(col)):
            email = str(row[col]).strip()
            if re.match(email_pattern, email):
                processed_row[col] = email
            else:
                processed_row[col] = None
    processed_data.append(processed_row)

# Prepare analysis dataframe (drop identifier columns)
analysis_df = df.drop(columns=identifier_columns, errors='ignore').copy()
analysis_df_for_ml = analysis_df.copy()  # will be used for ML after numeric selection

# Stats container
stats = {
    'total_students': len(df),
    'columns': list(df.columns),
    'identifier_columns': identifier_columns,
    'analysis_columns': list(analysis_df.columns),
    'summary_stats': {},
    'ml_predictions': {},
    'performance_insights': {},
    'grade_distribution': {},
    'risk_analysis': {},
    'individual_student_analysis': []
}

# Summary statistics
for col in analysis_df.columns:
    if pd.api.types.is_numeric_dtype(analysis_df[col]):
        col_series = analysis_df[col].dropna()
        if len(col_series) > 0:
            stats['summary_stats'][col] = {
                'mean': float(col_series.mean()),
                'median': float(col_series.median()),
                'std': float(col_series.std(ddof=0)) if len(col_series) > 1 else 0.0,
                'min': float(col_series.min()),
                'max': float(col_series.max())
            }
        else:
            stats['summary_stats'][col] = {'mean': None, 'median': None, 'std': None, 'min': None, 'max': None}
        # grade distribution for mark-like columns
        if any(keyword in col.lower() for keyword in ['grade', 'score', 'mark', 'test', 'exam']):
            stats['grade_distribution'][col] = {str(k): int(v) for k, v in analysis_df[col].value_counts().to_dict().items()}
    else:
        # categorical summarization
        stats['summary_stats'][col] = {k: int(v) for k, v in analysis_df[col].value_counts().to_dict().items()}

# Individual student analysis
for index, row in df.iterrows():
    student_analysis = {
        'index': int(index),
        'identifier': {},
        'performance_metrics': {},
        'risk_factors': {},
        'strengths': [],
        'weaknesses': [],
        'recommendations': [],
        'overall_performance': None,
        'risk_level': None,
        'at_risk': False,
        'risk_score': 0
    }

    # Identifier info
    for col in identifier_columns:
        if col in row and pd.notna(row[col]):
            student_analysis['identifier'][col] = str(row[col])

    # Collect numeric performance metrics from analysis_df columns
    numeric_scores = []
    for col in analysis_df.columns:
        val = row.get(col)
        if pd.notna(val) and pd.api.types.is_numeric_dtype(analysis_df[col]):
            try:
                value = float(val)
            except Exception:
                continue
            student_analysis['performance_metrics'][col] = value
            # treat columns that look like subject/score columns as academic scores
            if any(keyword in col.lower() for keyword in ['grade', 'score', 'mark', 'test', 'exam', 'math', 'english', 'science', 'history', 'physics', 'chemistry']):
                numeric_scores.append(value)
        else:
            # keep non-numeric as-is (e.g., category) if present
            if pd.notna(val):
                student_analysis['performance_metrics'][col] = val

    # Default fallback for academic_score if no explicit subject columns found:
    if not numeric_scores:
        # try to infer academic numeric columns (exclude attendance/study hours)
        for col in analysis_df.columns:
            if pd.api.types.is_numeric_dtype(analysis_df[col]):
                if not any(k in col.lower() for k in ['attendance', 'study', 'hours']):
                    v = row.get(col)
                    if pd.notna(v):
                        try:
                            numeric_scores.append(float(v))
                        except Exception:
                            pass

    # Compute academic_score (mean of academic numeric columns) or None
    if numeric_scores:
        academic_score = float(sum(numeric_scores) / len(numeric_scores))
    else:
        academic_score = 0.0

    # Fetch attendance & study_hours with case-insensitive keys
    att_key = find_metric_key(student_analysis['performance_metrics'], ['attendance', 'att'])
    study_key = find_metric_key(student_analysis['performance_metrics'], ['study_hours', 'study_hours', 'studyhours', 'study', 'hours'])

    attendance = student_analysis['performance_metrics'].get(att_key, 100 if att_key is None else student_analysis['performance_metrics'].get(att_key, 100))
    study_hours = student_analysis['performance_metrics'].get(study_key, 5 if study_key is None else student_analysis['performance_metrics'].get(study_key, 5))

    # Normalize numeric placeholders
    try:
        attendance = float(attendance)
    except Exception:
        attendance = 100.0
    try:
        study_hours = float(study_hours)
    except Exception:
        study_hours = 5.0

    # Clamp attendance
    attendance = min(max(attendance, 0.0), 100.0)
    # Convert study hours to 0-100 scale (e.g., 10 hours -> 100). Adjust as per your context.
    study_hours_score = min(max(study_hours * 10.0, 0.0), 100.0)

    # Weighted final performance score: marks 70%, attendance 20%, study_hours 10%
    final_performance_score = (0.7 * academic_score) + (0.2 * attendance) + (0.1 * study_hours_score)
    student_analysis['overall_performance'] = round(final_performance_score, 2)

    # Begin risk calculation dominated by academic performance
    risk_score = 0

    # Academic risk contribution
    if academic_score <= 0:
        # Extremely poor or missing academic marks
        risk_score += 60
        student_analysis['weaknesses'].append("Very poor or missing academic marks")
    elif academic_score < 40:
        risk_score += 50
        student_analysis['weaknesses'].append("Very poor marks — immediate intervention needed")
    elif academic_score < 60:
        risk_score += 30
        student_analysis['weaknesses'].append("Below-average academic performance")
    elif academic_score >= 85:
        student_analysis['strengths'].append("Excellent academic performance")

    # Attendance risk (secondary)
    if attendance < 70:
        risk_score += 20
        student_analysis['weaknesses'].append("Poor attendance record")
    elif attendance < 85:
        risk_score += 10
        student_analysis['weaknesses'].append("Inconsistent attendance")
    elif attendance >= 95:
        student_analysis['strengths'].append("Outstanding attendance")

    # Study hours contribution (minor)
    if study_hours < 3:
        risk_score += 20
        student_analysis['weaknesses'].append("Insufficient study hours")
    elif study_hours < 5:
        risk_score += 10
        student_analysis['weaknesses'].append("Limited study time")
    elif study_hours >= 7:
        student_analysis['strengths'].append("Excellent study discipline")

    # Subject-specific analysis (best/worst subject) using probable subject columns
    subject_performance = {}
    for col in analysis_df.columns:
        if pd.api.types.is_numeric_dtype(analysis_df[col]) and any(keyword in col.lower() for keyword in ['math', 'english', 'science', 'history', 'physics', 'chemistry', 'biology', 'score', 'mark', 'exam', 'test']):
            v = row.get(col)
            if pd.notna(v):
                try:
                    subject_performance[col] = float(v)
                except Exception:
                    pass

    if subject_performance:
        best_subject = max(subject_performance, key=subject_performance.get)
        worst_subject = min(subject_performance, key=subject_performance.get)
        student_analysis['best_subject'] = {'subject': best_subject, 'score': subject_performance[best_subject]}
        student_analysis['worst_subject'] = {'subject': worst_subject, 'score': subject_performance[worst_subject]}

        if subject_performance[best_subject] >= 85:
            student_analysis['strengths'].append(f"Excellent performance in {best_subject}")
        if subject_performance[worst_subject] < 70:
            student_analysis['weaknesses'].append(f"Needs improvement in {worst_subject}")
            student_analysis['recommendations'].append(f"Focus on improving {worst_subject} through extra practice")

    # Final risk classification
    if risk_score >= 60:
        student_analysis['risk_level'] = 'high'
        student_analysis['at_risk'] = True
    elif risk_score >= 30:
        student_analysis['risk_level'] = 'medium'
        student_analysis['at_risk'] = True
    else:
        student_analysis['risk_level'] = 'low'
        student_analysis['at_risk'] = False

    student_analysis['risk_score'] = int(risk_score)

    # Recommendations based on thresholds
    if student_analysis['overall_performance'] is not None and student_analysis['overall_performance'] < 75:
        student_analysis['recommendations'].extend([
            "Consider additional tutoring or study groups",
            "Schedule a meeting with subject teachers"
        ])

    if attendance < 90:
        student_analysis['recommendations'].append("Improve class attendance")

    if study_hours < 5:
        student_analysis['recommendations'].extend([
            "Establish a consistent study schedule",
            "Create a dedicated study environment"
        ])

    stats['individual_student_analysis'].append(student_analysis)

# --- Machine Learning Predictions (if possible) ---
try:
    # Select numeric columns for ML
    numeric_cols = analysis_df_for_ml.select_dtypes(include=[np.number]).columns.tolist()

    if len(numeric_cols) >= 2:
        # Attempt to pick a target column
        target_col = None
        for col in numeric_cols:
            if any(keyword in col.lower() for keyword in ['final', 'total', 'overall', 'gpa', 'cgpa']):
                target_col = col
                break

        if not target_col:
            # choose last numeric column not clearly attendance/study
            for col in reversed(numeric_cols):
                if not any(keyword in col.lower() for keyword in ['attendance', 'study', 'hours']):
                    target_col = col
                    break

        if target_col:
            feature_cols = [c for c in numeric_cols if c != target_col]
            # If no feature columns available, skip ML
            if len(feature_cols) >= 1:
                X = analysis_df_for_ml[feature_cols].fillna(analysis_df_for_ml[feature_cols].mean())
                y = analysis_df_for_ml[target_col].fillna(analysis_df_for_ml[target_col].mean())

                if len(X) > 1:
                    # Reset index to align with stats['individual_student_analysis']
                    X_reset = X.reset_index(drop=True)
                    y_reset = y.reset_index(drop=True)

                    X_train, X_test, y_train, y_test = train_test_split(X_reset, y_reset, test_size=0.2, random_state=42)
                    model = RandomForestRegressor(n_estimators=100, random_state=42)
                    model.fit(X_train, y_train)

                    y_pred = model.predict(X_test)
                    mse = mean_squared_error(y_test, y_pred)
                    r2 = r2_score(y_test, y_pred)

                    stats['ml_predictions'] = {
                        'target_column': target_col,
                        'feature_columns': feature_cols,
                        'model_performance': {
                            'mse': float(mse),
                            'r2_score': float(r2),
                            'rmse': float(np.sqrt(mse))
                        },
                        'feature_importance': {}
                    }

                    for i, col in enumerate(feature_cols):
                        stats['ml_predictions']['feature_importance'][col] = float(model.feature_importances_[i])

                    # Predict for all rows (aligned)
                    all_predictions = model.predict(X_reset)
                    stats['ml_predictions']['predictions'] = [float(p) for p in all_predictions]

                    # Determine threshold (bottom 30th percentile of actual target)
                    threshold = np.percentile(y_reset, 30)
                    at_risk_indices = []

                    for i, pred in enumerate(all_predictions):
                        manual_at_risk = stats['individual_student_analysis'][i].get('at_risk', False)
                        ml_at_risk = bool(pred < threshold)
                        student_at_risk = manual_at_risk or ml_at_risk
                        stats['individual_student_analysis'][i]['ml_prediction'] = float(pred)
                        stats['individual_student_analysis'][i]['ml_at_risk'] = ml_at_risk
                        if student_at_risk:
                            at_risk_indices.append(i)

                    stats['risk_analysis'] = {
                        'threshold': float(threshold),
                        'at_risk_count': len(at_risk_indices),
                        'at_risk_percentage': float(len(at_risk_indices) / len(df) * 100),
                        'at_risk_students': at_risk_indices,
                        'criteria': 'ML prediction below 30th percentile OR manual risk assessment'
                    }
    else:
        stats['ml_predictions'] = {'note': 'Not enough numeric columns for ML'}
except Exception as e:
    stats['ml_predictions'] = {'error': str(e)}
    print(f"ML Error: {str(e)}", file=sys.stderr)

# --- Performance insights ---
if stats['summary_stats']:
    numeric_stats = {k: v for k, v in stats['summary_stats'].items() if isinstance(v, dict) and v.get('mean') is not None}
    if numeric_stats:
        means = {k: v['mean'] for k, v in numeric_stats.items()}
        best_subject = max(means, key=means.get) if means else None
        worst_subject = min(means, key=means.get) if means else None
        stats['performance_insights'] = {
            'best_performing_area': best_subject,
            'worst_performing_area': worst_subject,
            'average_scores': means,
            'class_average': float(np.mean(list(means.values()))) if means else 0.0,
            'students_needing_attention': len([s for s in stats['individual_student_analysis'] if s['at_risk']]),
            'high_performers': len([s for s in stats['individual_student_analysis'] if s.get('overall_performance', 0) >= 85])
        }

# Final combined result
result = {
    'data': processed_data,
    'analysis': stats
}

print(json.dumps(result, indent=2))
