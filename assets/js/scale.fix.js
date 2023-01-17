(function(document) {
    var metas = document.getElementsByTagName('meta'),
        changeViewportContent = function(content) {
            for (var i = 0; i < metas.length; i++) {
                if (metas[i].name == "viewport") {
                    metas[i].content = content;
                }
            }
        },
        initialize = function() {
            changeViewportContent("width=device-width, minimum-scale=1.0, maximum-scale=1.0");
        },
        gestureStart = function() {
            changeViewportContent("width=device-width, minimum-scale=0.25, maximum-scale=1.6");
        },
        gestureEnd = function() {
            initialize();
        };


    if (navigator.userAgent.match(/iPhone/i)) {
        initialize();

        document.addEventListener("touchstart", gestureStart, false);
        document.addEventListener("touchend", gestureEnd, false);
    }
})(document);

const theme = localStorage.getItem('theme');
if (theme === "dark") {
	document.documentElement.setAttribute('data-theme', 'dark');
}

const userPrefers = getComputedStyle(document.documentElement).getPropertyValue('content');	

if (theme === "dark") {
	showLight();
	hideDark();
} else if (theme === "light") {
	hideLight();
	showDark();
} else if  (userPrefers === "dark") {
	document.documentElement.setAttribute('data-theme', 'dark');
	window.localStorage.setItem('theme', 'dark');
	showLight();
	hideDark();
} else {
	document.documentElement.setAttribute('data-theme', 'light');
	window.localStorage.setItem('theme', 'light');
	showDark();
	hideLight();
}

function modeSwitcher() {
	let currentMode = document.documentElement.getAttribute('data-theme');
	if (currentMode === "dark") {
		document.documentElement.setAttribute('data-theme', 'light');
		window.localStorage.setItem('theme', 'light');
		showDark();
		hideLight();
	} else {
		document.documentElement.setAttribute('data-theme', 'dark');
		window.localStorage.setItem('theme', 'dark');
		showLight();
		hideDark();
	}
}

function showLight() {
    document.getElementById("theme-toggle-light").style.display = "inline-block";
}

function hideLight() {
    document.getElementById("theme-toggle-light").style.display = "none";
}

function showDark() {
    document.getElementById("theme-toggle-dark").style.display = "inline-block";
}

function hideDark() {
    document.getElementById("theme-toggle-dark").style.display = "none";
}