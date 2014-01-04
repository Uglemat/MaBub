/* global localStorage, utils */
/*
    This file is just for saving and loading scores.
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

var scores = {};
scores.save_score = function (name, score) {
    var list = this.get_scores();
    list.push({name:name, score:score});
    localStorage.setItem("scores", JSON.stringify(list));
};
scores.get_scores = function () {
    var val = localStorage.getItem("scores");
    return val ? JSON.parse(val) : [];
}
scores.lowscores = function () {
    var list = this.get_scores();
    list.sort(function(a, b) {
        return a.score - b.score;
    });
    return list;
};
scores.highscores = function () {
    var list = this.lowscores();
    list.reverse();
    return list;
};

scores.fill_score_table = function (parentID, scoreslist) {
    var table = document.querySelector("#"+parentID+" table"),
        tr, name, score;

    for (var i=0; i<scoreslist.length && i<10; i++) {
        name =  utils.escape(scoreslist[i].name );
        score = scoreslist[i].score;

        tr = document.createElement("tr");
        tr.innerHTML = "<tr><td>"+ (i+1) +"</td><td>"+ score +"</td><td>"+ name +"</td></tr>";
        table.appendChild(tr);
    }
    if (!scoreslist.length)
        $(table.parentNode).append($("<p>No scores saved yet.</p>"));
}
