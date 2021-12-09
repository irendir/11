let storage = function() {
    let countries = [];
    let currencies = [];
    return {
        setCountries: data => countries = data,
        getCountries: () => countries,
        setCurrencies: data => currencies = data,
        getCurrencies: () => currencies
    }
}
const store = storage();

function sortCountries(field) {
    let sortedCountries = store.getCountries().sort((a, b) => a[field] > b[field] ? 1 : -1);
    renderCountries(sortedCountries);
}

function filterCountries(search) {
    let filteredCountries = store.getCountries().filter(country => {
        let {name, capital, region} = country;
        return (name.toLowerCase().indexOf(search) > -1
            || capital.toLowerCase().indexOf(search) > -1
            || region.toLowerCase().indexOf(search) > -1);
    });
    renderCountries(filteredCountries);
}

function setListeners() {
    let tableBody = $('table tbody');
    tableBody.on('click', function (e) {
        // e.target.classList.toggle('bg-warning');
        console.log(e.target.innerText);
    })

    let searchInput = $('#search');
    searchInput.on('keyup', function(e) {
        $('.countries-select').value = '';
        let searchValue = e.currentTarget.value;
        let searchLower = searchValue.toLowerCase();
        filterCountries(searchLower);
    })

    $('.countries-table thead').on('click', function(e) {
        console.log(e.target.getAttribute('data-sort'));
        if(e.target.getAttribute('data-sort')) {
            sortCountries(e.target.getAttribute('data-sort'));
        }
    })
}
let a = 0;
let b = 0;

function buildSelect(countries) {
    let regions = countries.map(country => country.region);
    let uniqueRegions = [];
    for(let region of regions) {
        if(region && uniqueRegions.indexOf(region) === -1) {
            uniqueRegions.push(region);
        }
    }
    console.log(uniqueRegions);
    let regionsHtml = uniqueRegions.reduce((acc, region) => acc + `<option value="${region}">${region}</option>`,
        `<option value="">Не выбрано</option>`)
    let regionsSelect = $.parseHTML('<select>');
    $(regionsSelect).addClass('form-control my-3 countries-select');
    $(regionsSelect).html(regionsHtml);
    $('.countries-filters').prepend(regionsSelect);
    $('.countries-select').on('change', function(e) {
        $('#search').val('');
        let value = e.currentTarget.value;
        let search = value.toLowerCase();
        filterCountries(search);
    })
}

function getFieldStr(arr, field = 'name') {
    return arr && arr.length ? arr.map(el => el[field]).join(', ') : '---';
}

function getBordersStr(borders, countries) {
    if(!countries) {
        countries = store.getCountries();
    }
    return borders.length ? borders.map(border => countries
        .filter(country => border === country.alpha3Code)[0].name)
        .join(', ') : '---';
}

function renderCountries(countries = []) {
    let a = new Date().getTime();
    let htmlTable = countries.reduce((acc, country, item) => acc + `<tr>
        <td>${item + 1}</td>
        <td>${country.name}</td>
        <td>${country.capital}</td>
        <td>${country.region}</td>
        <td>${country.population}</td>
        <td>${country.bordersStr}</td>
        <td>${country.currenciesStr}</td>
        <td>${country.languagesStr}</td>
    </tr>`, '');
    $('.container table tbody').html(htmlTable);
    console.log(new Date().getTime() - a);
}

function processCountries(countries) {
    b = new Date().getTime();
    console.log('countries are loaded', b - a);
    $('#load-countries').attr('enabled');
    $('.load-countries-spinner').addClass('hidden');
    $('table').removeClass('hidden');
    renderCountries(countries);
    buildSelect(countries);
    setListeners();
}

function loadCountries() {
    $('#load-countries').attr('disabled');
    $('.load-countries-spinner').removeClass('hidden');
    if(localStorage.getItem('countries')) {
        let countriesStr = localStorage.getItem('countries');
        let countries = JSON.parse(countriesStr);
        store.setCountries(countries);
        console.log(countries);
        processCountries(countries);
    } else {
        fetch('https://restcountries.com/v2/all').then(res => res.json()).then(function(data) {
            let countries = data.map(function(country) {
                let {alpha3Code, name, region, population, flag, languages, borders, currencies} = country;
                return {
                    alpha3Code, name,
                    capital: country.capital || '',
                    region, population, flag,
                    borders,
                    languages,
                    currencies
                }
            });
            countries = countries.map(country => {
                let {alpha3Code, name, capital, region, population, flag, languages, borders, currencies} = country;
                return {
                    alpha3Code, name, capital,
                    region, population, flag,
                    borders, languages, currencies,
                    currenciesStr: getFieldStr(currencies || []),
                    languagesStr: getFieldStr(languages || []),
                    bordersStr: getBordersStr(borders || [], countries)
                }
            })
            console.table(countries);
            store.setCountries(countries);
            console.log(JSON.stringify(countries));
            localStorage.setItem('countries', JSON.stringify(countries));
            processCountries(countries);
        });
    }
}

let loadBtn = $('#load-countries');
$(loadBtn).on('click', function(e) {
    a = new Date().getTime();
    loadCountries();
})

$('.google-link').on('click', function(e) {
    e.preventDefault();
    if(confirm('Are you sure')) {
        alert('Ну и зря');
        $(location).attr('href', 'e.currentTarget.attributes.href.value');
    }
})

function renderCurrencies(currencies) {
    let currenciesHtml = currencies.reduce((acc, currency) => acc + `<tr>
        <td>${currency.txt}</td>
        <td>${currency.rate}</td>
        <td>${currency.cc}</td></tr>`, '');
        $('.currencies-block table tbody').html(currenciesHtml);
}

function getCurrencies(dateStr) {
    fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?date=${dateStr}&json`)
        .then(res => res.json()).then(data => {
            store.setCurrencies(data || []);
            renderCurrencies(data);
        })
        .catch(err => alert('Sorry, please try again'));
}

$(window).on('load', function() {
    let currentDate = moment().format('YYYY-MM-DD');
    let currentDateStr = currentDate.replaceAll('-', '');
    $('#currencies-date').val(currentDate);
    getCurrencies(currentDateStr.replaceAll('-', ''));
})

$('#currencies-date').on('change', function(e) {
    let dateStr = e.currentTarget.value;
    getCurrencies(dateStr.replaceAll('-', ''));
})

$('.currencies-search').on('keyup', function(e) {
    let value = e.currentTarget.value.trim().toLowerCase();
    let currencies = store.getCurrencies();
    let filteredCurrencies = currencies.filter(currency => {
        let {txt, cc} = currency;
        return txt.toLowerCase().indexOf(value) > -1 || cc.toLowerCase().indexOf(value) > -1;
    });
    renderCurrencies(filteredCurrencies);
})

$('#login-form').on('submit', function(e) {
    e.preventDefault();
    let tel = $('#login-form input[name="tel"]').val;
})