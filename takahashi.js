/* 
 takahashi.js
 Created: [2016-01-20 水 19:46]
 Author: ono hiroko
 Github: kuanyui/takahashi.js
 */

onload = function() {
    function p(x){
        alert("p() -> " + JSON.stringify(x));
    }
    //======================================================
    // Variables
    //======================================================
    
    var markdownFile = 'source.md';
    
    //======================================================
    // Parser
    //======================================================
    
    function Parser(markdownFileUrl) {
        this.markdownFileUrl = markdownFileUrl;
        this.parsed = this.parse(markdownFileUrl);
    };

    Parser.prototype.getMarkdownFileContentAsString = function () {
        // XMLHttpRequest
        var r = new XMLHttpRequest();
        r.open("GET", this.markdownFileUrl,false); // sync
        r.overrideMimeType('text/plain; charset=utf-8');
        r.send();
        if (r.readyState == 4 && r.status == 200){
            return r.responseText;
        } else {
            return r.status;
        };
    };

    Parser.prototype.readLines = function(){
        var rawString = this.getMarkdownFileContentAsString();
        return rawString.split("\n");    
    };

    Parser.prototype.parse = function(){
        var shit = this;
        var lines = shit.readLines();
        shit.parsed = shit.__parse(lines);
        return shit.parsed;
    };

    Parser.prototype.__parse = function(lines, parsed){
        parsed = parsed || [];
        var imagePattern = /!\[\]\((.+)\)/;
        
        if (lines.length == 0) {
            return parsed;
        } else if (lines[0] == ""){
            return this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 6) == "# ![](") {
            var imgUrl = lines[0].match(imagePattern)[1];
            parsed.push({"type": "fullscreen-image", "path": imgUrl});
            return this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 4) == "![](") {
            var imgUrl = lines[0].match(imagePattern)[1];
            parsed[(parsed.length - 1)]['type'] = "title-and-image";
            parsed[(parsed.length - 1)]['imgUrl'] = imgUrl;
            return this.__parse(lines.slice(1), parsed);            
        } else if (lines[0].substring(0, 2) == "# ") { // Title
            var title = this.processEmphasisMarks(lines[0].substring(2));
            parsed.push({"type": "normal", "title": title});
            return this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 2) == "- ") { // Subtitle
            var subtitle = this.processEmphasisMarks(lines[0].substring(2));
            parsed[(parsed.length - 1)]['subtitle'] = subtitle;
            return this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 3) == "```") {
            var language = lines[0].substring(3);
            parsed.push({"type": "codeblock", "language": language, "code": ""});
            return this.processCodeBlock(lines.slice(1), parsed);
        } else {
            return this.__parse(lines.slice(1), parsed);
        };
    };

    Parser.prototype.processCodeBlock = function(lines, parsed){
        if (lines[0].substring(0,3) == "```"){
            // remove \n at the last line.
            var code = parsed[(parsed.length - 1)]['code'];
            parsed[(parsed.length - 1)]['code'] = code.substring(0, code.length-1);
            return this.__parse(lines.slice(1), parsed);
        } else {
            parsed[(parsed.length - 1)]['code'] += lines[0] + "\n";
            return this.processCodeBlock(lines.slice(1), parsed);
        };
    };
    
    Parser.prototype.processEmphasisMarks = function(string) {
        var italic = /\*(.+?)\*/g;
        var bold   = /\*\*(.+?)\*\*/g;
        var strike = /\+(.+?)\+/g;
        var newline = /\\\\/g;
        var output = string.replace(bold, "<b>$1</b>");
        output = output.replace(italic, "<i>$1</i>");
        output = output.replace(strike, "<s>$1</s>");
        return output.replace(newline, "<br/>");
    };

    
    //======================================================
    // Slide
    //======================================================
    // Variable with prefix '$' is a DOM element.

    var availablePageNumbers = [];
    var currentPageNumber = 0;
    
    function generateSlides() {
        var $slides = document.getElementsByTagName("slides")[0];
        var parser = new Parser(markdownFile);
        var slidesData = parser.parsed;
        for (var i = 0; i < slidesData.length; i++){
            availablePageNumbers.push(i);
            var slideData = slidesData[i];
            var $slide = document.createElement("slide");
            $slide.id = i;
            $slide.className = slideData.type;
            if (slideData.subtitle){
                $slide.innerHTML += "<h2>" + slideData.subtitle + "</h2>";};
            if (slideData.title){
                $slide.innerHTML += "<h1>" + slideData.title + "</h1>";};
            if (slideData.type=="fullscreen-image"){
                $slide.innerHTML += "<img src='" + slideData.imgUrl + "'></img>";};
            if (slideData.type=="codeblock"){
                $slide.innerHTML += "<pre><code class='" + slideData.language + "'>" +
                    slideData.code + "</code></pre>";};
            var $h1 = $slide.getElementsByTagName("h1")[0];
            if ($h1) {fitH1($h1);}
            var $h2 = $slide.getElementsByTagName("h2")[0];
            if ($h2) {$h2.style.fontSize = "4em";};
            $slides.appendChild($slide);
            fitSlide($slide);
        }
    }

    function show(from, to){
        // FROM page N TO page N
        document.getElementById(from).style.display = "none";
        document.getElementById(to).style.display = "block";
        currentPageNumber = to;
        location.hash = to;
    }
    
    function getMaxLineLength(string){
        var lines = string.split("<br>");
        return Math.max.apply({},
                              lines.map(
                                  function(x){
                                      var text = x.replace(/<.+?>/g, "");
                                      return text.length;}));
    }
    
    document.onkeydown = function(e) {
        var to = currentPageNumber + {39: 1, 37: -1}[e.which];
        if (to in availablePageNumbers) {
            show(currentPageNumber, to);
        }
    };
    
    function fitSlide($slide){
        var style = $slide.style;
        style.height = document.body.clientHeight + "px";
        style.width  = document.body.clientWidth + "px";
        style.display = "none";
    }
    
    function fitH1($ele){
        var style = $ele.style;
        var top;
        var left;
        var size = ((window.innerWidth / getMaxLineLength($ele.innerHTML)) * 0.8);
        style.position = "absolute";
        style.display = "block";
        style.fontSize = size + "px";
        style.left = "50%";
        style.top = "55%";
        style.transform = "translate(-50%, -50%)";
        style.margin = "0px";
        // Shit not work:
        while ($ele.offsetHeight > window.innerHeight){
            size = size * 0.95 ;
            style.fontSize = size + "px";
        }
    }
    
    //======================================================
    // Main
    //======================================================
    
    generateSlides();
    if (location.hash != "") {
        currentPageNumber = parseInt(location.hash.substring(1));
    } else {
        currentPageNumber = 0;
    };
    
    show(0, currentPageNumber);

};


