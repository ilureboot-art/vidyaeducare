# Build Project Workflow

This workflow details how to install dependencies and build the Next.js production bundle.

## Steps

1. **Ensure Node.js and npm are on the PATH**:
   If Node.js was recently installed and is not found in the current terminal, reload the environment path:
   ```powershell
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   ```

2. **Install Dependencies**:
   Install all node packages using npm:
   ```powershell
   npm install
   ```

3. **Compile and Build**:
   Build the production bundle of the Next.js application:
   ```powershell
   npm run build
   ```
