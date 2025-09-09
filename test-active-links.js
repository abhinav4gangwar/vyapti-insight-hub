// Test script to verify active link logic
const testCases = [
  { pathname: '/', expectedActive: ['/dashboard'] },
  { pathname: '/dashboard', expectedActive: ['/dashboard'] },
  { pathname: '/companies/RELIANCE', expectedActive: ['/dashboard'] },
  { pathname: '/ai-search', expectedActive: ['/ai-search'] },
  { pathname: '/triggers', expectedActive: ['/triggers'] },
  { pathname: '/notifications', expectedActive: ['/notifications'] },
];

function isActiveRoute(path, currentPathname) {
  if (path === '/dashboard') {
    return currentPathname === '/dashboard' || currentPathname === '/' || currentPathname.startsWith('/companies');
  }
  return currentPathname.startsWith(path);
}

console.log('Testing active link logic:\n');

testCases.forEach(({ pathname, expectedActive }) => {
  console.log(`Current path: ${pathname}`);
  
  const routes = ['/dashboard', '/ai-search', '/triggers', '/notifications'];
  const activeRoutes = routes.filter(route => isActiveRoute(route, pathname));
  
  console.log(`  Active routes: [${activeRoutes.join(', ')}]`);
  console.log(`  Expected: [${expectedActive.join(', ')}]`);
  
  const isCorrect = JSON.stringify(activeRoutes.sort()) === JSON.stringify(expectedActive.sort());
  console.log(`  ✅ ${isCorrect ? 'PASS' : 'FAIL'}\n`);
});
