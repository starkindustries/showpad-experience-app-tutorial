function init() {
    translations()
    search()
}

function translations() {
    document.getElementsByTagName("h1")[0].innerHTML = window.labels.translations.title.value
    document.querySelector('#search #search_submit').innerHTML = window.labels.translations.search_button.value
}

function search() {
    document.querySelector('#search #search_submit').addEventListener('click', (e) => {
        e.preventDefault()
        activeAssets = []

        tag = "tag1"
        ShowpadLib.getAssetsByTags([tag], (assets) => {
            displayResults(assets)
        })
    })
}

function displayResults(assets) {
    document.getElementById('results').innerHTML = ''

    for (let key in assets) {
        let asset = assets[key]
        let assetPreviewUrl = ShowpadLib.getAssetPreviewUrl(asset.id, asset.slug, 400);

        let result = document.createElement('div')
        result.className = 'result'

        let html = '<a href=showpad://file/' + asset.slug + '?modal=1>'
        html += '<img src="' + ShowpadLib.getAssetPreviewUrl(asset.id, asset.slug, 400) + '" />'
        html += '</a><input class="results_checkbox" type="checkbox" data-slug=' + asset.slug + '>'

        result.innerHTML = html
        document.getElementById('results').appendChild(result);

        loadExcelFile(asset)
    }
}

function loadExcelFile(asset) {
    // Get Asset File URL
    /* https://showpad.pages.showpad.io/showpad-js-lib/reference-v7.html#getassetfileurl */
    let url = ShowpadLib.getAssetFileUrl(asset.id, asset.slug)

    let link = document.createElement('div')
    link.innerHTML = '<a href=' + url + '>' + url + '</a>'
    document.getElementById('results').appendChild(link);

    window.ShowpadLib.getShowpadApi(function (apiConfig) {
        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + apiConfig.accessToken,
                'Content-Type': 'application/xlsx; charset=utf-8'
            }
        }).then(function (response) {
            // https://developer.mozilla.org/en-US/docs/Web/API/Body/blob
            return response.blob();
        }).then(function (myBlob) {
            console.log("FETCH EXCEL RESPONSE BLOB")
            console.log(myBlob);
            parseExcelFile(myBlob);
        })
    })
}

/* https://stackoverflow.com/questions/8238407/how-to-parse-excel-file-in-javascript-html5 */
function parseExcelFile(file) {
    console.log("EXCEL PARSER REPORTING!")

    var reader = new FileReader();
    reader.onload = function (e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {
            type: 'binary'
        });

        workbook.SheetNames.forEach(function (sheetName) {
            var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
            var json_object = JSON.stringify(XL_row_object);
            console.log(json_object);
        })
    };

    reader.onerror = function (ex) {
        console.log(ex);
    };

    reader.readAsBinaryString(file);
}

function handleFileSelect(evt) {

    var files = evt.target.files; // FileList object
    parseExcelFile(files[0]);
}

function actions() {
    document.querySelector('body').addEventListener('click', (e) => {
        if (e.target.classList.contains('results_checkbox')) {
            if (e.target.checked) {
                activeAssets.push(e.target.dataset.slug)
            } else {
                activeAssets = activeAssets.filter(asset => asset !== e.target.dataset.slug);
            }
        }
    })

    document.querySelector('#actions #actions_collection').addEventListener('click', (e) => {
        e.preventDefault()

        if (activeAssets.length > 0) {
            ShowpadLib.addAssetsToCollection(activeAssets, (collectionId) => {
                if (collectionId) console.log('Assets are added to collection with id: ' + collectionId)
            })
        }
    })

    document.querySelector('#actions #actions_share').addEventListener('click', (e) => {
        e.preventDefault()

        if (activeAssets.length > 0) {
            ShowpadLib.share('email', activeAssets, (result) => {
                if (result === 'success') console.log('Assets are shared with the client')
            })
        }
    })
}

window.onShowpadLibLoaded = () => {
    window.ShowpadLib.getShowpadApi((apiConfig) => {
        let url = window.location.href.split('configUrl=')[1].split('&')[0]
        url = decodeURIComponent(url)

        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + apiConfig.accessToken,
                'Content-Type': 'application/json; charset=utf-8'
            }
        })
            .then(function (response) {
                return response.json()
            })
            .then(function (data) {
                window.labels = data.labels
                window.contents = data.contents
                window.assets = data.assets

                init()
            })
    })
}
