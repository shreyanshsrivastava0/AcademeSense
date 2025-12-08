var tl = gsap.timeline({
    scrollTrigger: {
        trigger: "#main",
        start: "50% 50%",
        end: "150% 50%",
        scrub: 2,
        pin: true
    }
});

tl
    .to("#center", {
        height: "100vh"
    }, 'a')
    .to("#top", {
        top: "-50%"
    }, 'a')
    .to("#bottom", {
        bottom: "-50%"
    }, 'a')

    
    // .to("#top-h1", {
    //     top: "30%"
    // }, 'a')
    // .to("#bottom-h1", {
    //     top: "70%"
    // }, 'a'); 
