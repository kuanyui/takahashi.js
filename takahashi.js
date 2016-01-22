/* 
takahashi.js
Created: [2016-01-20 水 19:46]
Author: ono hiroko
Github: kuanyui/takahashi.js
 */

onload = function() {
    function p(x){
        alert(JSON.stringify(x));
    }
    //======================================================
    // Attributions
    //======================================================
    
    var body = document.body;
    var markdownFile = 'test.md';
    
    //======================================================
    // Parser
    //======================================================
    
    function Parser(markdownFileUrl) {
        this.markdownFileUrl = markdownFileUrl;
        this.parsed = "hello";
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
        shit.__parse(lines);
        return shit.parsed;
    };

    Parser.prototype.__parse = function(lines, parsed){
        parsed = parsed || [];
        var shit=this;
        var imagePattern = /^!\[\]\((.+)\)$/;
        
        // alert("******LINES:\n" + JSON.stringify(lines) +
        //       "\nlines.length = " + lines.length +
        //       "\n\n******PARSED:\n" + JSON.stringify(parsed));
        if (lines.length == 0) {
            shit.parsed = parsed;
            return parsed;
        } else if (lines[0] == ""){
            this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 6) == "# ![](" || lines[0].substring(0, 4) == "![](") {
            var url = lines[0].match(imagePattern)[1];
            parsed.push({"type": "image", "path": url});
            this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 2) == "# ") { // Title
            var title = this.processEmphasisMarks(lines[0].substring(2));
            parsed.push({"type": "normal", "title": title});
            this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 2) == "- ") { // Subtitle
            var subtitle = this.processEmphasisMarks(lines[0].substring(2));
            parsed[(parsed.length - 1)]['subtitle'] = subtitle;
            this.__parse(lines.slice(1), parsed);
        } else if (lines[0].substring(0, 3) == "```") {
            var language = lines[0].substring(3);
            var r = this.processCodeBlock(lines.slice(1));
            this.__parse(r['lines'], r['code']);
        } else {
            this.__parse(lines.slice(1), parsed);
        };
    };

    Parser.prototype.processCodeBlock = function(lines, outputStr){
        outputStr = outputStr || "";
        if (lines[0].substring(0,3) == "```"){
            return {"lines": lines.slice(1), "code": outputStr};
        } else {
            outputStr = outputStr.concat(lines[0], "\n");
            this.processCodeBlock(lines.slice(1), outputStr);
        };
    };
    
    //Parser.prototype.processTitle = function(lines, parsed){};
    //Parser.prototype.processSubtitle = function(lines, parsed){};
    //Parser.prototype.processImage = function(lines, parsed){};
    
    Parser.prototype.processEmphasisMarks = function(string) {
        var italic = /\*(.+?)\*/g;
        var bold   = /\*\*(.+?)\*\*/g;
        var strike = /\+(.+?)\+/g;
        var newline = "/\\\\/g";
        var output = string.replace(bold, "<b>$1</b>");
        output = output.replace(italic, "<i>$1</i>");
        output = output.replace(strike, "<s>$1</s>");
        return output.replace(newline, "<s>$1</s>");
    };
    //======================================================
    // Run
    //======================================================
    
    var parser = new Parser(markdownFile);
    parser.parse();
    p(parser.parsed);

};


