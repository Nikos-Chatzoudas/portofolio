import './style.css'
import './model.ts'

document.addEventListener('DOMContentLoaded', function () {
    let loadingText = document.getElementById('loadingText');
    let dots = '';
    let dotCount = 0;

    setInterval(() => {
        dotCount = (dotCount + 1) % 3; // Cycles through 0, 1, 2, 3
        dots = '.'.repeat(dotCount);
        loadingText.textContent = 'Loading' + dots;
    }, 200); // Adjust the speed of the dots here
});