/* eslint-disable @typescript-eslint/no-require-imports */
// npm run generate:frontend <module_name>
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const toCamelCase = (str) => {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const toPascalCase = (str) => {
  const camelCase = toCamelCase(str);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

const askQuestion = (query) => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function main() {
  console.log("=== Frontend Module Generator ===");
  const moduleName = process.argv[2] || await askQuestion("Enter frontend module name (e.g., product, event): ");
  if (!moduleName) {
    console.error("Module name is required.");
    process.exit(1);
  }

  const targetArea = 'frontEnd';
  const camelName = toCamelCase(moduleName);
  const pascalName = toPascalCase(moduleName);
  const sliceName = 'frontend' + pascalName + 'Slice';
  const sliceAlias = 'frontend' + pascalName;
  const appFolder = '(frontEnd)';
  
  const rootDir = path.join(__dirname);
  const srcDir = path.join(rootDir, 'src');

  // Paths
  const sliceDir = path.join(srcDir, 'redux', 'slices', targetArea);
  const sliceFilePath = path.join(sliceDir, sliceName + '.ts');

  const appDir = path.join(srcDir, 'app', appFolder, camelName);
  const appPagePath = path.join(appDir, 'page.tsx');
  
  const compDir = path.join(appDir, 'components');
  const compPath = path.join(compDir, pascalName + 'Content.tsx');

  // Ensure directories exist
  [sliceDir, appDir, compDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 1. Generate Redux Slice
  const sliceTemplate = `import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ${pascalName}Record {
  id: string;
  name?: string;
  // TODO: Add extra fields here
  [key: string]: any;
}

interface ${pascalName}State {
  records: ${pascalName}Record[];
  loading: boolean;
  error: string | null;
}

const initialState: ${pascalName}State = {
  records: [],
  loading: false,
  error: null,
};

export const fetchFrontend${pascalName}s = createAsyncThunk<
  ${pascalName}Record[],
  void,
  { rejectValue: string }
>("frontend${pascalName}/fetch${pascalName}s", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch(\`\${API_BASE_URL}/frontEnd/${camelName}s\`);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return rejectWithValue(json?.message || "Failed to fetch ${camelName}s");
    }
    if (json && json.success && json.data) {
      return json.data;
    }
    return rejectWithValue("Invalid data received");
  } catch (error: any) {
    return rejectWithValue(error.message || "Error fetching ${camelName}s");
  }
});

const ${sliceName} = createSlice({
  name: "frontend${pascalName}",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchFrontend${pascalName}s.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFrontend${pascalName}s.fulfilled, (state, action) => {
      state.loading = false;
      state.records = action.payload;
    });
    builder.addCase(fetchFrontend${pascalName}s.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || "Failed to fetch ${camelName}s";
    });
  },
});

export default ${sliceName}.reducer;
`;

  fs.writeFileSync(sliceFilePath, sliceTemplate);
  console.log(`✅ Created Redux Slice: ${sliceFilePath}`);

  // 2. Generate Page wrapper for List
  const pageTemplate = `import type { Metadata } from "next";
import Footer from "../common/Footer";
import Header from "../common/Header";
import ${pascalName}Content from "./components/${pascalName}Content";

export const metadata: Metadata = { title: "${pascalName}s" };

const ${pascalName}Page = () => {
  return (
    <div className="bg-body-secondary">
      <Header />
      <div className="container py-5 mt-5">
        <h2 className="mb-4">${pascalName}s</h2>
        <${pascalName}Content />
      </div>
      <Footer />
    </div>
  );
};

export default ${pascalName}Page;
`;

  fs.writeFileSync(appPagePath, pageTemplate);
  console.log(`✅ Created Frontend Page: ${appPagePath}`);

  // 3. Generate Component List
  const compTemplate = `"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchFrontend${pascalName}s } from "@/redux/slices/frontEnd/${sliceName}";

const ${pascalName}Content = () => {
  const dispatch = useAppDispatch();
  const { records, loading, error } = useAppSelector((state) => state.${sliceAlias} || { records: [], loading: false, error: null });

  useEffect(() => {
    dispatch(fetchFrontend${pascalName}s());
  }, [dispatch]);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (records.length === 0) {
    return <div className="alert alert-info">No ${camelName}s found.</div>;
  }

  return (
    <div className="row g-4">
      {records.map((record) => (
        <div key={record.id} className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title fw-bold">{record.name || 'Unnamed ${pascalName}'}</h5>
              <p className="card-text text-muted">
                {record.description || 'Description not available.'}
              </p>
              <button className="btn btn-primary btn-sm">View Details</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ${pascalName}Content;
`;
  fs.writeFileSync(compPath, compTemplate);
  console.log(`✅ Created Frontend Component: ${compPath}`);

  // 4. Update Redux store.ts (Auto-inject reducer)
  const storePath = path.join(srcDir, 'redux', 'store.ts');
  if (fs.existsSync(storePath)) {
    let storeContent = fs.readFileSync(storePath, 'utf8');
    
    // Check if it already has this slice
    if (!storeContent.includes(`${sliceAlias}: `)) {
      const importStatement = `import ${sliceAlias}Reducer from "./slices/frontEnd/${sliceName}";`;
      
      // Find last import
      const importMatches = [...storeContent.matchAll(/^import .*;$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const lastImportIndex = lastImport.index + lastImport[0].length;
        
        storeContent = storeContent.slice(0, lastImportIndex) + '\n' + importStatement + storeContent.slice(lastImportIndex);
      } else {
        storeContent = importStatement + '\n' + storeContent;
      }
      
      // Inject into reducer object
      const reducerMatch = storeContent.match(/reducer:\s*\{/);
      if (reducerMatch) {
        const insertIndex = reducerMatch.index + reducerMatch[0].length;
        const reducerLine = `\n    ${sliceAlias}: ${sliceAlias}Reducer,`;
        storeContent = storeContent.slice(0, insertIndex) + reducerLine + storeContent.slice(insertIndex);
        fs.writeFileSync(storePath, storeContent);
        console.log(`✅ Updated Redux Store: ${storePath}`);
      } else {
        console.log(`⚠️ Could not find reducer object in store.ts. Please add ${sliceAlias}: ${sliceAlias}Reducer manually.`);
      }
    } else {
      console.log(`⚠️ ${sliceAlias}Reducer already exists in store.ts.`);
    }
  }

  console.log("\n🎉 Frontend Module '" + moduleName + "' created successfully!");
  
  rl.close();
}

main().catch(console.error);
