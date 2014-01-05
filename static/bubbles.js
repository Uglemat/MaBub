/* global utils, $ */
/*
    This file contains lots of stuff related to the bubbles in the game.
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

function BubbleState(canvas, context) {
    this.canvas = canvas;
    this.context = context;
    this.color_mapping = {
        red:    "rgba(255, 0,   0,   0.6)",
        orange: "rgba(255, 149, 0,   0.6)",
        blue:   "rgba(0,   0,   255, 0.6)",
        green:  "rgba(0,   255, 0,   0.6)",
        purple: "rgba(234, 0,   255, 0.6)",
        grey:   "rgba(50,  50,  50,  0.6)",
        cyan:   "rgba(0,   229, 255, 0.6)",
        black:  "rgba(0,   0,   0,   0.6)"
    };
    this.colors = ["red", "orange", "blue", "green", "purple", "cyan"];
    this.rows = [];
    this.width = 16;
    this.height = 15;
    this.bubblesize = 30;
    this.small_top_row = true;
    this.changed = true;
    this.bg = "#444";
}

BubbleState.prototype.bubble_search = function (loc, callback) {
    /*

     Search for all bubbles, starting at location (loc.row, log.col), for which
     `callback' returns a truthy value. It will start with all the neighbors of `loc',
     and then search in all directions, finding all neighboring bubbles that match the
     criteria of `callback'. This will be used to

     (1) Search for bubbles of the same color after you've shot a new bubble.
     (2) Search for all bubbles connected to the top of the game area, so that
     I can remove every bubble that *isn't* connected to the top.

     `callback' is passed one argument, which is an object with properties `row' and `col'
     which `callback' will use to determine whether the object at that location meets the criteria.

     This function returns a list of objects with properties `row' and `col', which are the
     bubbles which matched the search.

     */
    var found, seen, pending, current;

    callback = callback || function () { return true; };

    if ($.isArray(loc)) {
        found = [];
        pending = loc;
        seen =    loc.slice(0);
    } else {
        found = [{row: loc.row, col: loc.col}];
        pending = this.neighbors(loc);
        seen =  [{row: loc.row, col: loc.col}].concat(pending);
    }

    while (pending.length) {
        current = pending.pop();

        if (callback(current)) {
            found.push(current);

            /*

             I thought that I might have to use some set implementation with constant time complexity
             for membership test when testing to see if bubbles have been 'seen', but using linear
             search on `seen' seems to work fine for my purposes, I can notice some waiting time when I'm
             searching for hundreds of bubbles, but that doesn't matter for this game.

             */
            this.neighbors(current).forEach(function (neighbor) {
                if (! seen.some(function (visited) {
                    return BubbleState.prototype.same_bubble(visited, neighbor);
                }) ) {
                    // neighbor hasn't been visited/seen before, so put it in the list
                    pending.push(neighbor); 
                    seen.push(neighbor);
                }
            });
        }
    }
    return found;
};


BubbleState.prototype.neighbors = function (loc) {
    /*

     Return a list of objects with properties `row' and `col' which are direct neighbors
     of (loc.row, loc.col). The length of the list will be max 6, because a bubble cannot
     have more direct neighbors than 6.

     */
    var possible = [{col: loc.col+1, row: loc.row},
                    {col: loc.col-1, row: loc.row}];

    var offset = this.small_row(loc.row) ? 1 : -1;
    
    possible.push({row: loc.row-1, col: loc.col});
    possible.push({row: loc.row-1, col: loc.col + offset});
    possible.push({row: loc.row+1, col: loc.col});
    possible.push({row: loc.row+1, col: loc.col + offset});

    return possible.filter(this.valid_location.bind(this)).filter(this.occupied.bind(this));
};


BubbleState.prototype.get_color = function (loc) {
    return this.rows[loc.row][loc.col];
};

BubbleState.prototype.set_color = function(loc, color) {
    this.rows[loc.row][loc.col] = color;

    this.changed = true;
};

BubbleState.prototype.new_color = function () {
    return utils.random_choice(this.colors_left());
},

BubbleState.prototype.same_bubble = function (loc1, loc2) {
    return (loc1.row === loc2.row && loc1.col === loc2.col);
};
BubbleState.prototype.same_color = function (loc1, loc2) {
    return this.get_color(loc1) === this.get_color(loc2);
};
BubbleState.prototype.remove_bubbles = function (bubbles) {
    /*

     Removes all the bubbles in the array `bubbles'

     */
    var self = this;
    bubbles.forEach(function (loc) {
        self.remove_bubble(loc, false);
    });
},


BubbleState.prototype.remove_bubble = function (bubble) {
    this.set_color(bubble, false);
},

BubbleState.prototype.find_islands = function (blacklist) {
    /*

     Find all the bubbles that aren't connected to the top of the game.

     Ignore the bubbles in `blacklist', which probably are the same-colored
     bubbles that have been selected for removal, and this function is called
     so as to collect all the to-be-removed bubbles in one big list. That's
     why the same-colored bubbles can't be removed right away, it has to wait.

     */

    var pending = [], loc;
    for (var col=0; col<this.width; col++) {
        loc = {col: col, row: 0};
        if (this.occupied(loc))
            pending.push(loc);
    }
    var found = this.bubble_search(pending, function (loc) {
        // Find all the bubbles that are connected to the top, and which
        // are not members of `blacklist'
        return !blacklist.some(function(black) {
            return BubbleState.prototype.same_bubble(black, loc);
        });
    });
    // Need to concat `blacklist' so that they will also be
    // filtered out of `removed'. The bubbles in `blacklists`
    // are not islands (presumably), so it would be an error to
    // include them in `removed'.
    found = found.concat(blacklist);

    var removed = [];

    for (var row=0; row<this.rows.length; row++) {
        for (var col=0; col<this.rows[row].length; col++) {
            if (this.get_color({row: row, col: col}))
                removed.push({row: row, col: col});
        }
    }

    removed = removed.filter(function (loc) {
        return !found.some(function (bubble) {
            return BubbleState.prototype.same_bubble(loc, bubble);
        });
    });
    return removed;
},


BubbleState.prototype.compute_actual_height = function () {
    var height = 0;
    var changed = false;

    for (var row=0; row<this.rows.length; row++) {
        for (var col=0; col<this.rows[row].length; col++) {
            if (this.get_color({row: row, col: col})) {
                height = row;
                changed = true;
                break;
            }
        }
    }
    return changed ? height+1 : 0;
};


BubbleState.prototype.place_bubble = function (loc, color) {
    /*

     Place a bubble at (loc.row, loc.col).

     */

    while (loc.row >= this.rows.length) {
        this.append_empty_row();
    }
    this.rows[loc.row][loc.col] = color;

    this.changed = true;
};


BubbleState.prototype.pixelwidth = function () {
    /*

     The width of the long rows in pixels.

     */
    return this.bubblesize*this.width;
},


BubbleState.prototype.colors_left = function () {
    /*

     Returns a list of all the colors that's left among the bubbles, or
     the default colors if there's no colors left.

     */
    var colors = [];

    for (var row=0; row<this.rows.length; row++) {
        for (var col=0; col<this.rows[row].length; col++) {
            var color = this.get_color({row: row, col: col});
            if (color && colors.indexOf(color) === -1)
                colors.push(color);
        }
    }
    return colors.length ? colors : this.colors;
},


BubbleState.prototype.occupied = function (loc) {
    /*

     Return true if there is a bubble currently located at (loc.row, loc.col), else false.

     */
    return (loc.row >= 0 &&
            loc.col >= 0 &&
            loc.row < this.rows.length &&
            loc.col < this.rows[loc.row].length &&
            !!this.rows[loc.row][loc.col]);
};


BubbleState.prototype.canvas_location = function (loc) {
    /*

     Calculate the (top-left) location on canvas for the bubble on row `loc.row` and col `loc.col`.
     
     You can alternatively pass in an object with the properties `row' and `col'.

     */
    return {
        y: loc.row*this.bubblesize,
        x: loc.col*this.bubblesize + (this.small_row(loc.row) ? this.bubblesize/2 : 0)
    };
};


BubbleState.prototype.bubble_location = function (pixloc) {
    /*

     Calculate the (row, col) bubble location for the (pixloc.x, pixloc.y) coordinates on canvas,
     regardless of whether or not there's a bubble there.

     This function was really difficult to make. I better not touch this again.

     */

    var x = Math.floor(pixloc.x),
        y = Math.floor(pixloc.y);

    var row, col;

    row = (y-y%this.bubblesize)/this.bubblesize;
    if (this.small_row(row)) {
        x -= 20;
        // Using `utils.mod' because `%' is acting funny with negative `x'.
        col = (x-utils.mod(x, this.bubblesize))/this.bubblesize;
    } else {
        col = (x-utils.mod(x, this.bubblesize))/this.bubblesize;
    }
    return { row: row, col: col };
};


BubbleState.prototype.small_row = function (row) {
    /* 

     Return true of `row' is a small row, false otherwise. The rows with
     1 less bubble are small rows.

     */
    return (row % 2 == 0) ? this.small_top_row : !this.small_top_row;
};


BubbleState.prototype.add_row = function () {
    /*

     Add a new row to the top filled with random bubbles.

     */
    var row = [];
    var colors = this.colors_left();
    for (var i=0; i<this.width - Number(!this.small_top_row); i++) {
        row.push(utils.random_choice(colors));
    }
    this.rows.unshift(row);
    this.small_top_row = !this.small_top_row;

    this.changed = true;
};


BubbleState.prototype.append_empty_row = function () {
    /*

     Append a new row filled with nothing to `this.rows'. Used internally to make sure
     `this.rows' is long enough, so that indices are not out of range.

     */
    this.rows.push(Array(this.width - Number(this.small_row(this.rows.length))));
};


BubbleState.prototype.draw_everything = function () {
    if (this.changed) {
        this.context.fillStyle = this.bg;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (var row=0; row<this.rows.length; row++) {
            for (var col=0; col<this.rows[row].length; col++) {
                var location = this.canvas_location({row: row, col: col});
                var color = this.get_color({row: row, col: col});
                if (color)
                    this.draw_bubble(location.x, location.y, color, this.context);
            }
        }
        this.changed = false;
    }
};


BubbleState.prototype.draw_bubble = function (x, y, color, context, size, center) {
    /*
     
     This bubble should be `this.bubblesize' (or `size') pixels wide, and (x, y) should be its top-left
     corner (unless `center' is truthy).

     */
    size = size || this.bubblesize;

    if (center) {
        x = x-size/2;
        y = y-size/2;
    }

    context.drawImage(ball, x, y, size, size);

    x = x+size/2;
    y = y+size/2;
    
    context.beginPath();
    
    context.arc(x, y, size/2-1.5, 0, Math.PI*2, true);
    context.fillStyle = this.color_mapping[color];
    context.fill();
};


BubbleState.prototype.valid_location = function (loc) {
    /*

     Return true if (loc.row, loc.col) is a valid bubble location.
     
     You can alternatively pass in an object with the properties `row' and `col'.

     */

    var width = this.width - (this.small_row(loc.row) ? 1 : 0);

    return (loc.row >= 0    &&
            loc.col >= 0    &&
            loc.col < width &&
            loc.row < this.height);
};


BubbleState.prototype.bubble_path = function (calc) {
    /*

     This function returns [path, dest] where `dest' is an object with
     `row' and `col' properties which is where the bubble will 'land',
     and where `path' is a list of objects with `x' and `y' properties
     which is the pixel coordinates where the bubble was visiting on its
     way to `path'.

     calc is an object of the form returned by `utils.projectile_calculations'.

     */
    var path = [],
        x = calc.x,
        y = calc.y,
        dx = calc.dx*2,
        dy = calc.dy*2,
        bubloc;

    if (dy >= 0 || calc.distance === 0)
        return alert("Bubble will never arrive at its destination! This should never happen, infinite loop!!");

    while (true) {
        x += dx;
        y += dy;

        if (x - this.bubblesize/2 < 0   ||
            x + this.bubblesize/2 > this.pixelwidth()) {
            dx = -dx; // swiching horizontal direction
        }

        bubloc = this.bubble_location({x:x, y:y});
        if (this.valid_location(bubloc) && !this.occupied(bubloc)) {
            path.push({x:x, y:y});
        }

        if (this.occupied(bubloc) || bubloc.row < 0) {
            // ^^ Bubble has hit something, now finishing

            // assume path.length > 0
            if (path.length === 0)
                return alert("Error! No place to put the bubble! This should never happen");

            var dest = this.bubble_location(path[path.length-1]);
            

            
            /*

             The following code tries to strip away the last part of the path which might
             not be so close to `dest'. It's a little bit tricky and bug-prone. If it's
             removed, it probably won't make that much of a difference.

             [Start of tricky code that can be removed]

             */

            var pixloc = this.canvas_location(dest);
            
            /*
             `canvas_location' returns the top-left location for the bubble,
             but the `x' and `y' in this function are in the middle of the bubble,
             thus I have to adjust here so that they both point to the middle:
             */
            
            pixloc.y += this.bubblesize/2;
            pixloc.x += this.bubblesize/2;
            
            var last_idx = path.length-1;
            var distance = utils.distance(path[last_idx].x, path[last_idx].y,
                                          pixloc.x,         pixloc.y);
            for (; last_idx > 0; last_idx--) {
                var new_dist = utils.distance(path[last_idx-1].x, path[last_idx-1].y,
                                              pixloc.x,           pixloc.y);
                
                //alert("new: "+ new_dist + "\nold: " + distance);
                // ^ This alert is what gives me some confidence that this tricky code
                // actually works.
                if (! (new_dist < distance)) {
                    break; // give up if the new distance isn't closer than the old
                }
                distance = new_dist;
            }
            path = path.slice(0, last_idx+1);

            /*

             [End of tricky code that can be removed]

             */



            return [path, dest];
        }
    }

};
