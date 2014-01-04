#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
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
"""


from flask import Flask, render_template

DEBUG = True
app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/play")
def play():
    return render_template("mabub.html")


if __name__ == "__main__":
    app.run(debug=DEBUG, host='0.0.0.0')
