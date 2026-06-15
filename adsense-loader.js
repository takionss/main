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
        // DOM에서 광고 삽입 영역 태그를 완전히 제거하여 구글 오인 가능성을 원천 차단
        window.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.adsbygoogle, .adsense-container').forEach(el => {
                el.remove();
            });
        });
    }
})();
