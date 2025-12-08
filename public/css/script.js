let btn = document.querySelector("#btn");

btn.addEventListener("click", ()=>{
  alert("Account Successfully Created");
});

document.getElementById("uploadForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const fileInput = document.getElementById("csvFile");
  const formData = new FormData();
  formData.append("csvFile", fileInput.files[0]);

  const res = await fetch("/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  renderTable(data);
});

function renderTable(data) {
  const tableHead = document.getElementById("tableHead");
  const tableBody = document.getElementById("tableBody");

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (data.length === 0) return;

  // headers
  const headers = Object.keys(data[0]);
  let headRow = "<tr>";
  headers.forEach(h => headRow += <th>${h}</th>);
  headRow += "</tr>";
  tableHead.innerHTML = headRow;

  // rows
  data.forEach(row => {
    let rowHtml = "<tr>";
    headers.forEach(h => rowHtml += <td>${row[h]}</td>);
    rowHtml += "</tr>";
    tableBody.innerHTML += rowHtml;
  });
}