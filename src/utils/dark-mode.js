const darkMode = () => {
  const themeToggleBtns = document.querySelectorAll('#theme-toggle');

  // State
  const theme = localStorage.getItem('theme');

  // On mount
  theme && document.body.classList.add(theme);

  // Handlers
  const handleThemeToggle = () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
      localStorage.setItem('theme', 'light-mode');
      updateIcon(true); // Update icon when body has light-mode class
    } else {
      localStorage.removeItem('theme');
      document.body.removeAttribute('class');
      updateIcon(false); // Update icon when body doesn't have light-mode class
    }
  };

  // Update icon based on body class
  const updateIcon = (isLightMode) => {
    const icon = document.querySelector('#theme-toggle svg');
    if (icon) {
      if (isLightMode) {
        // SVG icon for light mode
        icon.innerHTML = `
          <path
            d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
            fill="currentColor"
          />
        `;
      } else {
        // SVG icon for dark mode
        icon.innerHTML = `
          <path
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            fill="currentColor""
          />
        `;
      }
    }
  };

  // Events
  themeToggleBtns.forEach(btn =>
    btn.addEventListener('click', handleThemeToggle)
  );
};

export default darkMode;
