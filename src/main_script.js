function openNavBar(navID) {
    var sideNav = document.getElementById("mySidenav" + navID);
    if (sideNav) {
        sideNav.classList.add("active");
    } else {
        console.error("Navbar with ID " + navID + " not found.");
    }
}

function closeAllNavs() {
    var sideNavs = document.getElementsByClassName("sidenav");
    for (var i = 0; i < sideNavs.length; i++) {
        sideNavs[i].classList.remove("active");
    }
}