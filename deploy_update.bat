@echo off
echo ==========================================
echo  Deploying Bookly v3.0 (Major Update)
echo ==========================================
echo.
echo Updates included:
echo - Sign-in / Sign-up with saved email
echo - Password authentication
echo - Terms of Service agreement
echo - Orders page (all sales history)
echo - FAB on dashboard only
echo - Removed all dummy data (clean start)
echo - Dashboard teal color fix
echo.
echo 1. Adding all changes...
git add .
git commit -m "feat: sign-in/sign-up, orders page, terms, remove dummy data"
echo.
echo 2. Pushing to GitHub (Triggers Vercel)...
git push
echo.
echo ==========================================
echo  DEPLOYMENT SENT!
echo  Check Vercel dashboard in 1-2 minutes.
echo ==========================================
pause
