# Preview Project Workflow

This workflow details how to run the Next.js development server to preview and test the project locally.

## Steps

1. **Ensure Node.js and npm are on the PATH**:
   If Node.js was recently installed and is not found in the current terminal, reload the environment path:
   ```powershell
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

2. **Start Dev Server**:
   Run the development server command:
   ```powershell
   npm run dev
   ```

3. **Access App**:
   Open a browser and navigate to the local development URL:
   [http://localhost:9002](http://localhost:9002)
