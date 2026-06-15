(function() {
    // Only load AdSense if not running inside an iframe (Safety First)
    if (window.self === window.top) {
        const script = document.createElement('script');
        script.async = true;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2837251751819266";
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
    } else {
        console.log("AdSense loading blocked: running inside an iframe (Windows Mode).");
        // Hide ad containers to clean up the layout in Windows Mode
        window.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.adsbygoogle, .adsense-container').forEach(el => {
                el.style.display = 'none';
            });
        });
    }
})();
