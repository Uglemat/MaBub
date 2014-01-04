/* global $, utils */
/*
    This file is for watching certain variables and objects.
    Copyright (C) 2014  Mattias Ugelvik

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*

 .. need to add documentation ..

 .. actually, I think I'm too lazy for that.

*/

var watch = {
    preinit: function () {
        this.settingsdiv = this.div.find("div#watching_settings");
        this.textarea =    this.div.find("textarea#watching_textarea");
        this.sections =    this.div.find("span.watching");
    },
    init: function () {
        var self = this;
        self.minimize_conf = $("<input type='checkbox' id='minimize_watch_box' class='watching nothidden' checked>");
        self.minimize_conf.click(function() {  self.div.toggleClass("minimized");  });

        self.opaque_conf = $("<input type='checkbox' id='opaque_box' class='watching' checked>");
        self.opaque_conf.click(function() {  self.div.toggleClass("opaque");  });

        self.close_button = $("<button class='watching'>Close</button>");
        self.close_button.click(function() {  self.div.css({display: "none"});  });

        self.pause_button = $("<button class='watching'>Pause</button>");
        self.pause_button.click(function() {
            self.div.toggleClass("paused");
            self.paused = !self.paused;
            self.pause_button.text(self.paused ? "Unpause" : "Pause");
        });

        this.settingsdiv.append("<label for='minimize_watch_box' class='watching nothidden'>Expanded: </label>");
        this.settingsdiv.append(self.minimize_conf);
        this.settingsdiv.append("<label for='opaque_box' class='watching'>Opaque: </label>");
        this.settingsdiv.append(self.opaque_conf);
        this.settingsdiv.append(self.close_button);
        this.settingsdiv.append(self.pause_button);

        this.div.find("#exec_button").click(function () {
            eval(self.textarea.val());
        });


        self.div.appendTo("body");
    },
    div: $("<div id='watching_box' class='opaque'><span class='watching'></span>" +
           "<hr class='watching'><div id='watching_settings'></div><textarea class='watching' rows=2 id='watching_textarea'>" +
           "</textarea><button id='exec_button' class='watching'>Evaluate code</button></div>"),
    jobs: [],
    vals: {},
    eavesdropped: {},
    paused: false,
    interval: 1000, // update every {} ms
    job: function (func) {
        this.jobs.push(func);
    },
    button: function (name, func) {
        var button = $("<button class='watching'></button>");
        button.text(name);
        button.click(func);
        this.settingsdiv.append(button);
    }
};
watch.preinit();

(function () {

    function info_pair_html(key, val) {
        val = (typeof val === "undefined") ? "undefined" : val.toString();
        if (val.indexOf("\n") >= 0) {
            // cutting off multiline strings. Because I don't like them.
            val = val.slice(0, val.indexOf("\n")) + " ...";
        }

        val = "<span class='watching-val'>"+ utils.escape(val) +"</span>";
        key = "<span class='watching-key'>"+ utils.escape(key) +"</span>";
        return "<pre>"+ key +": "+ val +"</pre>";
    }

    function section_html(text) {
        return "<h4 class='watching-section'>"+ utils.escape(text) +"</h4>";
    }

    function append_object_section (obj, section_name, bits_list) {
        // Mutates `bits_list'
        var keys = Object.keys(obj);
        keys.sort();

        if (keys.length > 0) {
            if (typeof section_name !== "undefined") {
                bits_list.push(section_html(section_name));
            }
            keys.forEach(function(key) {
                bits_list.push(info_pair_html(key, obj[key]));
            });
        }
    }

    watch.start = function() {
        watch.init();
        window.setInterval(function() {
            if (watch.paused) { return; }

            var info_bits = [];

            for (var i=0; i < watch.jobs.length; i++) {
                append_object_section(watch.jobs[i](), "JOB #"+(i+1).toString(), info_bits);
            }

            append_object_section(watch.vals, "VALS", info_bits);
            

            var names = Object.keys(watch.eavesdropped);
            names.sort();
            for (var i=0; i < names.length; i++) {
                var name = names[i];
                append_object_section(watch.eavesdropped[name], "EAVESDROPPED OBJECT: "+ name,
                                      info_bits);
            }

            var newinfo = info_bits.join("");

            if (newinfo !== watch.sections.html()) {
                watch.sections.html(newinfo);
            }
        }, watch.interval);
    };
}());
