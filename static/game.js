/* global utils, $, performance, watch, alertify, scores */
/*
    This file contains the game itself, with the main loop, and some animation stuff. And baby names.
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

var baby_names = ["Ace", "Admire", "Americus", "California", "Couture", "Deva", "Excel", "Fedora", "Gilmore", "Hailo", "Inny", "J'Adore", "Jagger", "Jazzy", "Jeevika", "Joshitha", "Juju", "Jury", "Kaixin", "Kirshelle", "Leeloo", "Mclean", "Monalisa", "Oasis", "Orchid", "Queenie", "Rilo", "Rogue", "Samanda", "Sanity", "Sesame", "Shoog", "Starlit", "Thinn", "Tigerlily", "Twisha", "Ummi", "Vanille", "Vinique", "Yoga", "Zealand", "Aero", "Alpha", "Ball", "Bond", "Burger", "Cajun", "Casanova", "Cello", "Cobain", "Crusoe", "Devid", "Donathan", "Drifter", "Elite", "Espn", "Exodus", "Four", "Goodluck", "Google", "Haven'T", "Hippo", "Htoo", "Hurricane", "Jedi", "Kix", "Legacy", "Mango", "Mowgli", "Navaryous", "Neon", "Pate", "Pawk", "Popeye", "Rogue", "Rysk", "Savior", "Shimon", "Thunder", "Tron", "Turbo", "Vice", "Villiam", "Xenon", "Zaniel"];
// ^ source: http://www.babycenter.com/0_unusual-baby-names-of-2012_10375911.bc

var anim = (function () {
    function RectangleParticle(startx, starty, spread, speed, growth, size, longevity) {
        spread = spread || 10;
        speed  = speed  || 300;
        growth = growth || 20;
        size   = size   || 5;
        longevity = longevity || .5;

        this.frames_to_live = Infinity;
        this.seconds_to_live = utils.random_range(0, longevity);
        this.x = startx + utils.random_range(-spread, spread);
        this.y = starty + utils.random_range(-spread, spread);
        this.z =  utils.random_range(0, size);
        this.dz = utils.random_range(0, growth);
        this.dx = utils.random_range(-speed, speed);
        this.dy = utils.random_range(-speed, speed);
        this.color = utils.random_color();
        this.gravity = 2000;
    }
    RectangleParticle.prototype.clear = function () {};
    RectangleParticle.prototype.animate = function (dt, context) {
        this.x += this.dx*dt;
        this.y += this.dy*dt;
        this.z -= this.dz*dt;


        this.dy += this.gravity*dt;

        context.fillStyle = "black";
        context.fillRect(this.x-1, this.y-1, 6+this.z, 6+this.z);
        context.fillStyle = this.color;
        context.fillRect(this.x,   this.y,   4+this.z, 4+this.z);
    };
    return {
        base: {
            frames_to_live:  Infinity,
            seconds_to_live: Infinity,
            clear: function () {}
        },
        RectangleParticle: RectangleParticle,
        perform_animations: function (animations, context, timepassed) {
            animations.forEach(function(animation) {
                animation.frames_to_live--;
                animation.seconds_to_live -= timepassed;
                if (animation.animate(timepassed, context)) {
                    animation.frames_to_live = 0;
                    animation.clear(context);
                }
            });
            return animations.filter(function(elem) {
                return elem.frames_to_live > 0 && elem.seconds_to_live > 0;
            });
        }
    };
})();


function Game() {
    var self = this;

    this.bubble_canvas  = document.getElementById('bubble_canvas');
    this.bubble_context = this.bubble_canvas.getContext('2d');
    this.bubbles = new BubbleState(this.bubble_canvas, this.bubble_context);

    for (var i=0; i<5; i++)
        this.bubbles.add_row();



    this.bubble_queue_length = 3;
    this.bubble_queue = [];
    this.fill_bubble_queue();




    this.score = 0;
    this.update_infobox();



    this.running = true;
    this.effects_enabled = true;




    this.gunx = this.bubbles.pixelwidth() / 2,
    this.guny = this.bubbles.height * this.bubbles.bubblesize;
    this.mousex = this.gunx;
    this.mousey = this.guny;


    this.canvas = document.getElementById('game_canvas'),
    this.context = this.canvas.getContext('2d');

    this.canvas.width  = this.bubbles.bubblesize * this.bubbles.width;
    this.canvas.height = this.guny+40;


    this.bubble_canvas  = document.getElementById('bubble_canvas');
    this.bubble_context = this.bubble_canvas.getContext('2d');

    this.bubble_canvas.width  = this.bubbles.bubblesize * this.bubbles.width;
    this.bubble_canvas.height = this.guny+40;

    this.mousemove_event_func = function(e) {
        self.mousex = e.layerX * (self.canvas.width  / $(self.canvas).width() );
        self.mousey = e.layerY * (self.canvas.height / $(self.canvas).height());
    };
    this.click_event_func = function(e) {
        if (self.transitions.length ||
            self.mousey > (self.guny-self.bubbles.bubblesize/2))
            return; /*
                     Ignore the click, because either there is already an ongoing transition (another ball probably),
                     or the mouse clicked too low (can't shoot downwards).
                     */



        var calculations = utils.projectile_calculations(self.mousex, self.mousey, self.gunx, self.guny);
        
        var result = self.bubbles.bubble_path(calculations),
            path = result[0],
            dest = result[1];

        self.transitions.push(utils.object(anim.base, {
            timepassed: 0,
            color: self.current_color(),
            speed: 800,
            prev_loc: undefined,
            clear: function (context) {
                if (this.prev_loc) {
                    context.clearRect(this.prev_loc.x, this.prev_loc.y,
                                      self.bubbles.bubblesize, self.bubbles.bubblesize);
                }
            },
            animate: function (dt, context) {
                this.timepassed += dt*this.speed;
                var loc_index = Math.floor(this.timepassed);

                if (loc_index >= path.length) {
                    self.place_bubble_and_stuff(dest, this.color);
                    return true;
                }

                this.clear(context);

                var loc = path[loc_index];
                loc.x = loc.x - self.bubbles.bubblesize/2;
                loc.y = loc.y - self.bubbles.bubblesize/2,

                self.bubbles.draw_bubble(loc.x, loc.y, this.color, context);

                this.prev_loc = loc;
            }
        }));

    };

    this.canvas.addEventListener('mousemove', this.mousemove_event_func);
    this.canvas.addEventListener('click', this.click_event_func);

    this.transitions = [];
    this.effects = [];
    this.animations  = [utils.object(anim.base, {
        clear: function (context) {
            context.clearRect(0, self.guny - self.bubbles.bubblesize, self.canvas.width, self.canvas.height);
        },
        animate: function (dt, context) {
            var size = self.bubbles.bubblesize;

            this.clear(context);
            context.fillStyle = "rgb(30,32,30)";
            context.fillRect(0, self.guny - size, self.canvas.width, self.canvas.height);

            self.bubble_queue.reduceRight(function(val, current) {
                var bubblenum = val[0];
                var this_size = size-bubblenum*5;
                var acc_distance = val[1];

                var x_offset = acc_distance + this_size + 5;

                self.bubbles.draw_bubble(self.gunx + x_offset, self.guny, current, context, this_size, true);
                return [bubblenum+1, x_offset];

            }, [0, -(size+5) // <- To make the x_offset zero so as to align properly for the first (biggest) bubble
               ]);
        }
    })];


    this.prev_time = performance.now();

    window.requestAnimationFrame(self.main_loop.bind(self));
}
Game.prototype.current_color = function () {
    return this.bubble_queue[this.bubble_queue.length-1];
},
Game.prototype.update_infobox = function() {
    $("#score_val").text(this.score);
}
Game.prototype.fill_bubble_queue = function (amount) {
    amount = amount || this.bubble_queue_length;
    for (var i=0; i<amount; i++) {
        this.bubble_queue.push(this.bubbles.new_color());
    }
},
Game.prototype.place_bubble_and_stuff = function (dest, color) {
    this.bubbles.place_bubble(dest, color);

    var self = this;
    var bubble_removal_success = false;

    var found = this.bubbles.bubble_search(dest, function (loc) {
        return self.bubbles.same_color(loc, dest);
    });
    if (found.length > 2) {
        bubble_removal_success = true;
        var removable = found.concat(this.bubbles.find_islands(found));
        // `removable' should now contain all bubbles that are to be removed, that is,
        // all neighboring bubbles of the same color, and all bubbles that became islands
        // as a result of the removal of the same-colored bubbles. Or, they aren't removed
        // *yet*, they're just collected in that list.


        this.score += Math.pow(removable.length, 2);
        this.update_infobox();

        if (this.effects_enabled) {
            removable.forEach(function(loc) {
                var pixloc = self.bubbles.canvas_location(loc);
                for (var p=0; p<5; p++) {
                    self.effects.push(new anim.RectangleParticle(pixloc.x, pixloc.y));
                }
            });
        }
        this.bubbles.remove_bubbles(removable);
    }

    this.bubble_queue.pop();
    if (bubble_removal_success)
        this.fill_bubble_queue(1);

    if (!this.bubble_queue.length) {
        this.fill_bubble_queue();
        var numrows = Math.max(1, 6 - self.bubbles.compute_actual_height());
        for (var i=0; i<numrows; i++)
            this.bubbles.add_row();
    }

    var height = this.bubbles.compute_actual_height();
    if (height >= this.bubbles.height) {
        new_game("Game over! Start new game?");
        
    }
    else if (height === 0) {
        var message = "Congratulations! You scored: "+ this.score +"! Submit score? (locally)";
        alertify.prompt(message, function (e, name) {
            if (e) scores.save_score(name, self.score);
            new_game("Play again?");
        }, utils.random_choice(baby_names));
    }
};
Game.prototype.main_loop = function() {
    /*
     
     This is the main loop of the game.

     */
    var current_time = performance.now();
    this.timepassed = (current_time - this.prev_time) / 1000;
    this.prev_time = current_time;


    $(this.canvas).height(window.innerHeight);
    $(this.bubble_canvas).height(window.innerHeight);



    if (this.effects_enabled)
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.transitions = anim.perform_animations(this.transitions, this.context, this.timepassed);
    this.animations  = anim.perform_animations(this.animations,  this.context, this.timepassed);

    if (this.effects_enabled)        
        this.effects = anim.perform_animations(this.effects, this.context, this.timepassed);

    this.bubbles.draw_everything();



    if (this.running)
        window.requestAnimationFrame(this.main_loop.bind(this));
};

























var ball = new Image();
ball.onload = function () {
    new_game();
};

ball.src = ball_location;



var game;
function new_game(prompt) {
    if (game) {
        game.running = false;
        game.canvas.removeEventListener('mousemove', game.mousemove_event_func);
        game.canvas.removeEventListener('click',     game.click_event_func);
    }

    if (prompt) {
        alertify.set({labels: {ok: "Yes", cancel: "No"}});
        alertify.confirm(prompt, function (ok) {
            if (ok) {
                new_game();
            } else {
                window.location = index_location;
            }
        });
        return;
    }


    game = new Game();
}
$("#newgamebtn").click(function () { new_game(); });


//watch.button("Add Row",     function () { game.bubbles.add_row(); });
//watch.button("new Game();", function () { new_game(); });
//watch.job(function () {
//    return {
//        "game.timepassed": game.timepassed,
//        "game.bubble_queue": game.bubble_queue,
//        "game..mousey": game.mousey,
//        "game.guny": game.guny
//    };
//});
//watch.start();
