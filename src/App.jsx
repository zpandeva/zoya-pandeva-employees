import React, { useState } from "react";
import Papa from "papaparse";
import { DataGrid } from "@mui/x-data-grid";
import { differenceInDays } from "date-fns";

export default function App() {
  const [rows, setRows] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const fileType = file.name.split(".").pop().toLowerCase();
    if (fileType !== "csv") {
      alert("Please upload a CSV file.");
      return;
    }
    Papa.parse(file, {
      complete: (result) => {
        processData(result.data);
      },
      header: true,
    });
  };

  const processData = (data) => {
    const projects = new Map();
    data.forEach((entry) => {
      const { EmpID, ProjectID, DateFrom, DateTo } = entry;
      const from = Date.parse(DateFrom);
      const to = DateTo === "NULL" || !DateTo ? new Date() : Date.parse(DateTo);

      if (!projects.has(ProjectID)) {
        projects.set(ProjectID, []);
      }
      projects.get(ProjectID).push({ EmpID, from, to });
    });
    const pairs = new Map();

    projects.forEach((employees, projectId) => {
      for (let i = 0; i < employees.length; i++) {
        for (let j = i + 1; j < employees.length; j++) {
          const emp1 = employees[i];
          const emp2 = employees[j];
          const overlapFrom = new Date(Math.max(emp1.from, emp2.from));
          const overlapTo = new Date(Math.min(emp1.to, emp2.to));
          if (overlapFrom < overlapTo) {
            const daysWorked = differenceInDays(overlapTo, overlapFrom);
            const key = `${emp1.EmpID}-${emp2.EmpID}-${projectId}`;
            pairs.set(key, {
              id: key,
              emp1: emp1.EmpID,
              emp2: emp2.EmpID,
              projectId,
              daysWorked,
            });
          }
        }
      }
    });

    const rows = Array.from(pairs.values());
    const projectsDaysWorked = new Map();
    rows.forEach((row) => {
      const { id, projectId, daysWorked } = row;
      if (!projectsDaysWorked.has(projectId)) {
        projectsDaysWorked.set(projectId, []);
      }
      projectsDaysWorked.get(projectId).push(daysWorked);
    });
    const projectToMax = new Map();
    projectsDaysWorked.forEach((projectDaysWorked, projectId) => {
      if (!projectToMax.has(projectId)) {
        projectToMax.set(projectId, Math.max(...projectDaysWorked));
      }
    });

    const longestPeriod = [];
    rows.forEach((r) => {
      if (projectToMax.get(r.projectId) === r.daysWorked) {
        longestPeriod.push(r);
      }
    });
    setRows(longestPeriod);
  };

  const columns = [
    { field: "emp1", headerName: "Employee ID #1", width: 150 },
    { field: "emp2", headerName: "Employee ID #2", width: 150 },
    { field: "projectId", headerName: "Project ID", width: 150 },
    { field: "daysWorked", headerName: "Days worked", width: 150 },
  ];

  return (
    <div style={{ marginLeft: "50px" , paddingTop:0}}>
      <h2>
      Employee Pair Viewer
      </h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ margin: "20px" }}
      />
      <div style={{ height: 500, width: "100%" }}>
        <DataGrid rows={rows} columns={columns} pageSize={10} />
      </div>
    </div>
  );
}
