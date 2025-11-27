import random
from flask import Flask, render_template, request
import pandas as pd
import math
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "TMDB_all_movies.csv")  # CSV in repo root

df = pd.read_csv(CSV_PATH)

POSTER_BASE = "https://image.tmdb.org/t/p/w780"
DEFAULT_POSTER = "https://via.placeholder.com/300x450?text=No+Image"
MOVIES_PER_PAGE = 30

def add_posters(dataframe):
    dataframe["poster_full"] = dataframe["poster_path"].apply(
        lambda x: POSTER_BASE + x if x.strip() != "" else DEFAULT_POSTER
    )
    return dataframe

@app.route("/", methods=["GET"])
def index():
    page = request.args.get("page", 1)
    try:
        page = int(page)
    except (ValueError, TypeError):
        page = 1

    start_idx = (page - 1) * MOVIES_PER_PAGE
    end_idx = start_idx + MOVIES_PER_PAGE

    # Get filters from query parameters
    genre = request.args.get("genre", "")
    lang = request.args.get("language", "")

    results = df.copy()

    if genre:
        results = results[results["genres"].str.contains(genre, case=False, na=False)]
    if lang:
        results = results[results["original_language"].str.lower() == lang.lower()]

    results = results.sort_values("popularity", ascending=False)
    total_pages = math.ceil(len(results) / MOVIES_PER_PAGE)
    movies_page = results.iloc[start_idx:end_idx]
    movies_page = add_posters(movies_page)

    return render_template(
        "index.html",
        movies=movies_page.to_dict(orient="records"),
        page=page,
        total_pages=total_pages,
        genre=genre,
        language=lang
    )


# Movie detail route
@app.route("/movie/<int:movie_id>")
def movie_detail(movie_id):
    from_page = request.args.get("from_page", 1)  # default to 1
    movie = df[df["id"] == movie_id]

    if movie.empty:
        return "Movie not found", 404

    movie = add_posters(movie).iloc[0]

    return render_template(
        "movie_detail.html",
        movie=movie,
        from_page=from_page
    )

# Surprise Me route
@app.route("/surprise")
def surprise():
    random_movie = df.sample(n=1).iloc[0]
    random_movie = add_posters(pd.DataFrame([random_movie])).iloc[0]
    return render_template("movie_detail.html", movie=random_movie)


@app.route("/aboutme")
def aboutme():
    return render_template("aboutme.html")
# Handle 404 errors
@app.errorhandler(404)
def page_not_found(e):
    # Pass the mistyped URL path to the template
    return render_template("404.html", path=request.path), 404

if __name__ == "__main__":
    app.run(debug=True)


