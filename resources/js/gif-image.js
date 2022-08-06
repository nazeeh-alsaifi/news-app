import axios from "axios";

export class GifImage {
    static get toolbox() {
        return {
            title: "Gif",
            icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
        };
    }
    constructor({ data }) {
        this.data = data;
        this.wrapper = undefined;
        this.loadingSpinner = undefined;
        this.rating = "g";
        this.limit = 6;
        this.offset = 0;
        this.lang = "en";
        this.q = "";
        this.provider = process.env.MIX_GIF_PROVIDER;
        this.apiKey =
            this.provider === "giphy" ? process.env.MIX_GIPHY_API_KEY : "";
        this.gifApiEndpoint =
            this.provider === "giphy" ? "https://api.giphy.com/v1/gifs" : "";
        this.trendingEndpoint =
            this.provider === "giphy"
                ? `${this.gifApiEndpoint}/trending?api_key=${this.apiKey}&limit=${this.limit}&rating=${this.rating}`
                : "";
        this.searchEndpoint =
            this.provider === "giphy"
                ? `${this.gifApiEndpoint}/search?api_key=${this.apiKey}&q=${this.q}&offset=${this.offset}&limit=${this.limit}&rating=${this.rating}`
                : "";
    }

    render() {
        this.wrapper = document.createElement("div");
        this.wrapper.classList.add(
            "gif-selector",
            "d-flex",
            "flex-column",
            "align-items-center",
            "border"
        );

        // add input element for searching with classes for styling
        const input = document.createElement("input");
        input.classList.add("form-control", "w-50", "my-3");
        input.placeholder = "Search via giphy";

        // add div element for the loading spinner when request is fetching
        this.loadingSpinner = document.createElement("div");
        this.loadingSpinner.classList.add("lds-hourglass");

        // if there is old data
        // (when having block that contain gif and leaving title empty and pressing add new article)
        if (this.data && this.data.url) {
            this._selectImage(this.data.url);
            return this.wrapper;
        }

        this.wrapper.appendChild(input);
        this.wrapper.appendChild(this.loadingSpinner);

        // fetching trending gifs when render is running for the first time
        this._fetchAndCreateImages(this._getTrendingData.bind(this));

        // when user search listener
        input.addEventListener(
            "keyup",
            _.debounce(async (event) => {
                // removing old results
                this.wrapper.querySelector(".gifs-wrapper").remove();
                // making the spinner visible
                this.loadingSpinner.toggleAttribute("hidden");

                //setting q query param
                this.q = event.target.value;
                this._updateSearchEndpoint();

                // render trending when no q value
                this.q
                    ? this._fetchAndCreateImages(this._getSearchData.bind(this))
                    : this._fetchAndCreateImages(
                          this._getTrendingData.bind(this)
                      );
            }, 500)
        );

        return this.wrapper;
    }

    // when q change
    _updateSearchEndpoint() {
        this.searchEndpoint =
            this.provider === "giphy"
                ? `${this.gifApiEndpoint}/search?api_key=${this.apiKey}&q=${this.q}&offset=${this.offset}&limit=${this.limit}&rating=${this.rating}`
                : "";
    }

    // use one of the fetch functions (tranding or search) and create thier
    _fetchAndCreateImages(fetchFunction) {
        fetchFunction()
            .then((data) => {
                const urls = data.data.reduce((acc, obj) => {
                    acc.push(obj.images.fixed_height_downsampled.url);
                    return acc;
                }, []);
                this._createImages(urls);
            })
            .catch((error) => console.error(error))
            .finally(() => {
                this.loadingSpinner.toggleAttribute("hidden");
            });
    }

    async _getTrendingData() {
        try {
            let res = await fetch(this.trendingEndpoint);
            return res.json();
        } catch (error) {
            console.error(error);
        }
    }

    async _getSearchData() {
        try {
            let res = await fetch(this.searchEndpoint);
            return res.json();
        } catch (error) {
            console.error(error);
        }
    }

    //not used anymore
    _wrapWithRowCol(element, colWidth) {
        const row = document.createElement("div");
        row.classList.add("row");

        const col = document.createElement("div");
        col.classList.add(colWidth ? "col-" + colWidth : "col");

        col.appendChild(element);
        row.appendChild(col);
        return row;
    }

    //not used anymore
    _createImage(url, captionText) {
        const image = document.createElement("img");
        const caption = document.createElement("div");

        image.src = url;
        caption.contentEditable = true;
        caption.innerHTML = captionText || "";

        this.wrapper.innerHTML = "";
        this.wrapper.appendChild(image);
        this.wrapper.appendChild(caption);
    }

    //used when pressing an image and when there is old data and validation failed
    _selectImage(url) {
        const image = document.createElement("img");
        image.classList.add("my-3");
        image.src = url;

        this.wrapper.innerHTML = "";
        this.wrapper.classList.toggle("border");
        this.wrapper.appendChild(image);
    }

    // use array of urls to create gifs grid to choose from
    _createImages(urls) {
        const row = document.createElement("div");
        row.classList.add("gifs-wrapper", "row", "g-2");

        urls.forEach((url) => {
            const col = document.createElement("div");
            col.classList.add("col-sm-4");

            const card = document.createElement("div");
            card.classList.add("card");

            const image = document.createElement("img");
            image.classList.add("card-img");
            image.src = url;

            image.addEventListener(
                "click",
                function (event) {
                    this._selectImage(event.target.src);
                }.bind(this)
            );
            card.appendChild(image);
            col.appendChild(card);
            row.appendChild(col);
        });
        this.wrapper.appendChild(row);
    }

    save(blockContent) {
        const img = blockContent.querySelector("img");
        return {
            url: img.src,
        };
    }

    validate(savedData) {
        if (!savedData.url.trim()) {
            return false;
        }
        return true;
    }
}