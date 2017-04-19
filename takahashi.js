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

    var markdownFile = markdownFile || 'source.md';

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
        var imagePattern = /!\[\]\((.+?)\)/;

        if (lines.length == 0) {
            return parsed;
        } else if (lines[0] == ""){
            return this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 6) == "# ![](") {
            var imgUrl = lines[0].match(imagePattern)[1];
            parsed.push({"type": "fullscreen-image", "imgUrl": imgUrl});
            return this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 4) == "![](") {
            var imgUrl = lines[0].match(imagePattern)[1];
            parsed[(parsed.length - 1)]['type'] = "image-and-title";
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
                $slide.innerHTML += "<img class='fullscreen-image' src='" + slideData.imgUrl + "'></img>";};
            if (slideData.type=="image-and-title"){
                $slide.innerHTML += "<img class='image-and-title' src='" + slideData.imgUrl + "'></img>";};
            if (slideData.type=="codeblock"){
                $slide.innerHTML += "<pre><code class='" + slideData.language + "'>" +
                    slideData.code + "</code></pre>";};
            var $h1 = $slide.getElementsByTagName("h1")[0];
            if ($h1) {fitH1($h1);}
            var $h2 = $slide.getElementsByTagName("h2")[0];
            if ($h2) {fitH2($h2);}
            $slides.appendChild($slide);
            fitSlide($slide);
        }
    }

    function switchSlide(from, to){
        // FROM page N TO page N
        document.getElementById(from).style.display = "none";
        document.getElementById(to).style.display = "block";
        document.getElementById(to).style.opacity = 0;
        currentPageNumber = to;
        location.hash = to;
        render(to)
    }
    function render (pageN) {
        var $slide = document.getElementById(pageN);
        var _h1 = $slide.getElementsByTagName("h1")
        var $h1 = _h1 ? _h1[0] : null;
        var _h2 = $slide.getElementsByTagName("h2")
        var $h2 = _h2 ? _h2[0] : null;
        var _img = $slide.getElementsByTagName("img")
        var $img = _img ? _img[0] : null
        var _block = $slide.getElementsByTagName("pre")
        var $block = _block ? _block[0] : null;
        if ($h2) {
            var h2size = parseInt($h2.style.fontSize.substring(0, $h2.style.fontSize.length-2))
            console.log("h2 width", $h2.offsetWidth, "MAX:", getSlideWidth())
            while ($h2.offsetHeight > getSlideHeight()) {
                h2size *= 0.95;
                $h2.style.fontSize = h2size + "px";
            }
            while ($h2.offsetWidth > getSlideWidth()) {
                h2size *= 0.95;
                $h2.style.fontSize = h2size + "px";
            }
        }
        if ($h1) {
            var h1Size = parseInt($h1.style.fontSize.substring(0, $h1.style.fontSize.length-2))
            console.log("h1 width", $h1.offsetWidth, "MAX:", getSlideWidth())
            while ($h1.offsetHeight > getSlideHeight()) {
                h1Size *= 0.95;
                $h1.style.fontSize = h1Size + "px";
            }
            while ($h1.offsetWidth > getSlideWidth()) {
                h1Size *= 0.95;
                $h1.style.fontSize = h1Size + "px";
            }
            if ($h2) {
                if ($img) {
                    $h2.style.top = "10px"
                    $h1.style.top = $h2.offsetTop + $h2.offsetHeight + "px"

                } else {
                    console.log("----> ", ($h2.offsetTop + $h2.offsetHeight) + $h1.offsetHeight, getSlideHeight())
                    if (($h2.offsetTop + $h2.offsetHeight) + $h1.offsetHeight > getSlideHeight()) {
                        $h1.style.top = ($h2.offsetTop + $h2.offsetHeight) + "px"
                        while (($h2.offsetTop + $h2.offsetHeight) + $h1.offsetHeight > getSlideHeight()) {
                            h1Size *= 0.95;
                            $h1.style.fontSize = h1Size + "px";
                        }
                    } else {
                        $h1.style.top = ($h2.offsetTop + $h2.offsetHeight) + (((getSlideHeight() - ($h2.offsetTop + $h2.offsetHeight)) - $h1.offsetHeight) / 2 ) + "px"
                        console.log($h1.style.top)
                    }
                }
            } else {
                $h1.style.top = ((getSlideHeight() - $h1.offsetHeight) / 2) + "px"
            }
        }
        if ($block) {
            $block.style.top = ((getSlideHeight() - $block.offsetHeight) / 2) + "px"
        }
        if ($img) {
          var h = window.innerHeight;
          var w = window.innerWidth;
          if ($h2) {
            h -= 86;
            $img.style.top = "86px";
          }
          if (w/$img.clientWidth < h/$img.clientHeight) {
            $img.style.width = w + "px";
            $img.style.height = "auto"
          }
          else {
            $img.style.height = h + "px";
            $img.style.width = "auto";
          }
        }
        document.getElementById(pageN).style.opacity = 1;
    }

    function getHtmlStringMaxLineLength(HTMLString){
        var lines = HTMLString.split("<br>");
        return Math.max.apply({},
                              lines.map(
                                  function(line){
                                      line = line.replace(/<.+?>/g, "");
                                      line = line.replace(/[\x00-\x7F]{2}/g, "x"); //ascii
                                      return line.length;}));
    }

    document.onkeydown = function(e) {
        var to = currentPageNumber + {39: 1, 37: -1}[e.which];
        if (to in availablePageNumbers) {
            switchSlide(currentPageNumber, to);
        }
    };
    document.ontouchstart = function(e) {
      if (e.target.href) { return }
        var to = currentPageNumber + (e.touches[0].pageX > innerWidth / 2 ? 1 : -1);
        if (to in availablePageNumbers) {
            switchSlide(currentPageNumber, to);
        }
    }
    function getSlideHeight() {
        return Math.min(window.innerHeight, window.innerWidth);
    }
    function getSlideWidth() {
        return getSlideHeight() * (4/3);
    }

    function fitSlide($slide){
        var style = $slide.style;
        var min = getSlideHeight();
        var width = min * 4/3 + "px";
        var height = min + "px";
        style.height = height;
        style.width = width;
        style.position = "absolute";
        style.margin = '0 auto'; // center abs
        style.left = 0;        // center abs
        style.right = 0;       // center abs
        style.overflow = 'hidden';
        style.display = "none";
    }

    function fitH2($h2){
        var size = ((getSlideHeight() / getHtmlStringMaxLineLength($h2.innerHTML)) * 1.5);
        $h2.style.display = "table";
        $h2.style.position = "absolute"
        $h2.style.margin = 'auto';
        $h2.style.left = 0;
        $h2.style.right = 0;
        $h2.style.top = "20px";
        $h2.style.fontSize = Math.min(60, size) + "px";
    }
    function fitH1($ele){
        var style = $ele.style;
        var top;
        var left;
        var size = ((getSlideHeight() / getHtmlStringMaxLineLength($ele.innerHTML)) * 1.5);
        style.display = "table";
        style.position = "absolute";
        style.margin = "0 auto"
        style.top = "20%";
        style.left = 0;
        style.right = 0;
        style.fontSize = size + "px";
    }

    function resizeAllImages(){
        var i;
        /* .fullscreen-image */
        var fullscreenImages = document.getElementsByClassName("fullscreen-image");
        if (fullscreenImages.length != 0) {
            for (i=0; i<fullscreenImages.length; i++) {
              if (fullscreenImages[i].tagName.toUpperCase()=="IMG") {
                fullscreenImages[i].style.position = "absolute";
                fullscreenImages[i].style.margin = "auto";
                fullscreenImages[i].style.top = "0";
                fullscreenImages[i].style.bottom = "0";
                fullscreenImages[i].style.left = "0";
                fullscreenImages[i].style.right = "0";
              }
              else {
                fullscreenImages[i].style.height = window.innerHeight + "px";
                fullscreenImages[i].style.width = "auto";
              }
            }
        }
        /* .image-and-title */
        var images = document.querySelectorAll("img.image-and-title");

        if (images.length != 0) {
            for (i=0; i<images.length; i++){
                var image = images[i];
                image.style.height = (window.innerHeight * 0.7) + "px";
                image.style.position = "absolute";
                image.style.margin = "auto";
                image.style.bottom = 0;
                image.style.left = 0;
                image.style.right = 0;
                var h1 = image.parentNode.getElementsByTagName("h1")[0];
                console.log(image);
                /* Check if <h2> exist */
                var h2 = image.parentNode.getElementsByTagName("h2");
                if (h2.length != 0) {
                    h1.style.top = "48px";
                    h1.style.fontSize = (getSlideHeight() * 0.12) +"px";
                    h2 = h2[0];

                }
            }
        }
    }

    //======================================================
    // Main
    //======================================================

    function getTextMaxLineLength (text) {
        var lines = text.split("\n");
        return Math.max.apply(null,
                              lines.map(function(line){
                                  line = line.replace(/[\u4e00-\u9faf\u3000-\u30ff\uff00-\uff60\uffe0-\uffe6]/g, "AA");
                                  return line.length;
                              }));
    }

    function main(){
        generateSlides();
        if (location.hash != "") {
            currentPageNumber = parseInt(location.hash.substring(1));
        } else {
            currentPageNumber = 0;
        };

        resizeAllImages();
        var codeblocks = document.getElementsByTagName("pre");
        for (var i=0; i<codeblocks.length; i++) {
            var block = codeblocks[i];
            var size = ((getSlideHeight() / getTextMaxLineLength(block.textContent)) * 1.8);
            block.style.fontSize = size + "px";
            block.style.position = 'absolute';
            block.style.width = getSlideWidth() + "px"
            block.style.top = "0px";
            hljs.highlightBlock(block);
        }

        switchSlide(0, currentPageNumber);
    }

    main();
};
