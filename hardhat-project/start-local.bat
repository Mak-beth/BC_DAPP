@echo off
echo Starting Hardhat node and deploying contract...
start "Hardhat Node" cmd /k "npx hardhat node"
timeout /t 4 /nobreak >nul
echo Deploying contract...
npx hardhat run scripts/deploy.ts --network localhost
echo.
echo Done! Contract deployed and .env.local updated.
echo You can now start the frontend with: cd ../frontend ^&^& npm run dev
pause
