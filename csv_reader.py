# import pandas as pd 
# import csv
# import json
# import sys
# import numpy as np
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.model_selection import train_test_split
# from sklearn.metrics import mean_squared_error, r2_score
# from sklearn.preprocessing import LabelEncoder
# import warnings
# warnings.filterwarnings('ignore')

# file_path = sys.argv[1]



# # Read CSV data
# df = pd.read_csv(file_path)

# # Convert to list of dictionaries for original data
# data = df.to_dict('records')

# # Statistical Analysis
# stats = {
#     'total_students': len(df),
#     'columns': list(df.columns),
#     'summary_stats': {},
#     'ml_predictions': {},
#     'performance_insights': {},
#     'grade_distribution': {},
#     'risk_analysis': {}
# }

# # Generate summary statistics for numeric columns
# for col in df.columns:
#     if df[col].dtype in ['int64', 'float64']:
#         stats['summary_stats'][col] = {
#             'mean': float(df[col].mean()),
#             'median': float(df[col].median()),
#             'std': float(df[col].std()),
#             'min': float(df[col].min()),
#             'max': float(df[col].max())
#         }
        
#         # Grade distribution if it looks like a grade column
#         if any(keyword in col.lower() for keyword in ['grade', 'score', 'mark', 'test', 'exam']):
#             grade_counts = df[col].value_counts().to_dict()
#             stats['grade_distribution'][col] = {k: int(v) for k, v in grade_counts.items()}
#     else:
#         # For categorical columns
#         value_counts = df[col].value_counts().to_dict()
#         stats['summary_stats'][col] = {k: int(v) for k, v in value_counts.items()}

# # Machine Learning Predictions (if we have appropriate data)
# try:
#     # Look for common student performance columns
#     numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
#     if len(numeric_cols) >= 2:
#         # Try to identify target variable (final grade/score)
#         target_col = None
#         for col in numeric_cols:
#             if any(keyword in col.lower() for keyword in ['final', 'total', 'overall', 'gpa']):
#                 target_col = col
#                 break
        
#         if not target_col and len(numeric_cols) > 0:
#             target_col = numeric_cols[-1]  # Use last numeric column as target
        
#         if target_col and len(numeric_cols) > 1:
#             # Prepare features and target
#             feature_cols = [col for col in numeric_cols if col != target_col]
#             X = df[feature_cols].fillna(df[feature_cols].mean())
#             y = df[target_col].fillna(df[target_col].mean())
            
#             if len(X) > 1:
#                 # Split data
#                 X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                
#                 # Train model
#                 model = RandomForestRegressor(n_estimators=100, random_state=42)
#                 model.fit(X_train, y_train)
                
#                 # Predictions
#                 y_pred = model.predict(X_test)
                
#                 # Model performance
#                 mse = mean_squared_error(y_test, y_pred)
#                 r2 = r2_score(y_test, y_pred)
                
#                 stats['ml_predictions'] = {
#                     'target_column': target_col,
#                     'feature_columns': feature_cols,
#                     'model_performance': {
#                         'mse': float(mse),
#                         'r2_score': float(r2),
#                         'rmse': float(np.sqrt(mse))
#                     },
#                     'feature_importance': {}
#                 }
                
#                 # Feature importance
#                 for i, col in enumerate(feature_cols):
#                     stats['ml_predictions']['feature_importance'][col] = float(model.feature_importances_[i])
                
#                 # Predict for all students
#                 all_predictions = model.predict(X)
#                 stats['ml_predictions']['predictions'] = all_predictions.tolist()
                
#                 # Risk analysis - identify students at risk
#                 threshold = np.percentile(y, 25)  # Bottom 25%
#                 at_risk_indices = [i for i, pred in enumerate(all_predictions) if pred < threshold]
                
#                 stats['risk_analysis'] = {
#                     'threshold': float(threshold),
#                     'at_risk_count': len(at_risk_indices),
#                     'at_risk_percentage': float(len(at_risk_indices) / len(df) * 100),
#                     'at_risk_students': at_risk_indices
#                 }

# except Exception as e:
#     stats['ml_predictions'] = {'error': str(e)}

# # Performance insights
# if stats['summary_stats']:
#     numeric_stats = {k: v for k, v in stats['summary_stats'].items() if isinstance(v, dict) and 'mean' in v}
#     if numeric_stats:
#         # Find best and worst performing areas
#         means = {k: v['mean'] for k, v in numeric_stats.items()}
#         best_subject = max(means, key=means.get) if means else None
#         worst_subject = min(means, key=means.get) if means else None
        
#         stats['performance_insights'] = {
#             'best_performing_area': best_subject,
#             'worst_performing_area': worst_subject,
#             'average_scores': means,
#             'class_average': float(np.mean(list(means.values()))) if means else 0
#         }

# # Combine original data with analysis
# result = {
#     'data': data,
#     'analysis': stats
# }

# print(json.dumps(result))
