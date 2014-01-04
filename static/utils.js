/*
    This file contains certain functions that are used throughout the project.
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
var utils = {
    escape: function (str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    random_choice: function (array) {
        /*

         Return a random element of `array'.

         */
        return array[Math.floor(Math.random()*array.length)];
    },
    random_range: function (from, to) {
        /*
         
         Return a number in the range [from, to). It doesn't take away
         the fractional part, so expect numbers like 0.2943 ...

         */
        return Math.random()*(to - from) + from;
    },
    random_int_range: function (from, to) {
        /*
         
         Return an number in the range [from, to), with no fractional part.

         */
        return Math.floor(this.random_range(from, to));
    },
    random_color: function () {
        /*

         returns a random color of the form "#??????".

         When called with 0 arguments, then red, green, and blue
         will all be in the range [0, 256) (but not the same, most
         likely).

         When called with two arguments `from', and `to', then red, green
         and blue will all be in the range [from, to).

         When called with six arguments, `redfrom', `redto', `greenfrom',
         `greento', `bluefrom', `blueto', then the colors red, green, and blue
         will be in the range of their respective '<color>from', '<color>to'
         arguments.

         */

        var red, green, blue, numargs = arguments.length;

        var from = (numargs === 0) ? 0   : arguments[0],
            to   = (numargs === 0) ? 256 : arguments[1];

        red = [from, to];
        if (numargs === 6) {
            green = [arguments[2], arguments[3]];
            blue  = [arguments[4], arguments[5]];
        }
        else {
            green = red;
            blue  = red;
        }

        var result = "#";
        [red, green, blue].forEach(function (color) {
            var part = utils.random_int_range(color[0], color[1]).toString(16);
            result += (part.length == 1) ? "0"+part : part;
        });
        return result;
    },
    object: function (proto, properties) {
        /*

         Create new object that inherits from the object `proto'
         and has the properties (and values) of the object `properties'.

         */
        var obj = Object.create(proto);
        for (var prop in properties) {
            if (properties.hasOwnProperty(prop)) {
                obj[prop] = properties[prop];
            }
        }
        return obj;
    },
    mod: function(n, m) {
        /*

         Was having trouble with the `%' operator for negative numbers. Now I can use this.
         I think it works. I don't know why :( modulo is making my head spin.

         */
        return ((n%m) + m) % m;
    },
    distance: function (x1, y1, x2, y2) {
        /*

         Calculates the distance between the points (x1, y1) and (x2, y2).

         */
        // Using the pythagorean theorem to calculate the distance. It works, please don't ask me why.
        return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
    },
    projectile_calculations: function (x1, y1, x2, y2) {
        /*

         This function contains math that is over my head. I collect the math
         in this function so I don't have to repeat the calculations different places,
         I want to minimize the chance that I screw up. I'm fairly sure this math is working
         because I tested it, but I'm very skeptical of things I don't understand.

         */


        var distance = utils.distance(x1, y1, x2, y2);

        // The difference between the x and y axis. Can be negative.
        var diffx = x1 - x2,
            diffy = y1 - y2;

        var dx = diffx / distance,
            dy = diffy / distance;

        // If the projectile (x2, y2) moves to (x2+dx, y2+dy), it will get closer and closer to
        // to (x1, y1), as long as it doesn't move past that point. According to my observations.

        return {
            distance: distance,
            diffx: diffx,
            diffy: diffy,
            dx: dx,
            dy: dy,
            x: x2,
            y: y2
        };
    }
};
