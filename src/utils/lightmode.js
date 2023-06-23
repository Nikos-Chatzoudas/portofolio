
export function addLightModeClass(element) {
    element.classList.add('light-mode');
}

export function removeLightModeClass(element) {
    element.classList.remove('light-mode');
}

const checkbox = document.getElementById('toggleSwitch');


const storedTheme = localStorage.getItem('theme');

if (storedTheme === 'dark-mode') {
    checkbox.checked = true;
    addLightModeClass(document.body);
} else {
    checkbox.checked = false;
    removeLightModeClass(document.body);
}

function handleCheckboxChange() {
    const isChecked = this.checked;

    if (isChecked) {
        addLightModeClass(document.body);
        localStorage.setItem('theme', 'dark-mode');
    } else {
        removeLightModeClass(document.body);
        localStorage.setItem('theme', 'light-mode');
    }
}

checkbox.addEventListener('change', handleCheckboxChange);
