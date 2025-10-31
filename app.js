var express = require('express');
var path = require('path');
var { engine } = require('express-handlebars');
var app = express();
var fs = require ("fs");
const port = process.env.port || 3000;
const { query, validationResult } = require('express-validator');
const dataPath = path.join(__dirname, 'airbnb_with_photos.json'); 
app.use(express.static(path.join(__dirname, 'public')));
app.engine('.hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main', 
    layoutsDir: path.join(__dirname, 'views/layouts'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
    formatServiceFee: (fee) => {
      // If empty or null, return 0
      if (!fee || fee.trim() === '') return '0';
      return fee;
    },
    isEmptyServiceFee: (fee) => {
      // Returns true if fee is empty
      return !fee || fee.trim() === '';
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.get('/', (req, res)=> {
res.render('index', { title: 'Express',
    studentName:'Tarhembe Daniel',
    studentId :'N01719446'
 });
});
// About Route for CV

app.get('/about', (req, res) => {
    res.render('about', { title: 'Resume for Tarhembe Daniel' });
});

// All Data Route (Converted to use res.render('allData'))
app.get('/data', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error(' Error reading JSON:', err.message);
          
            return res.status(500).render('error', { title: 'Error', message: 'Error loading JSON file' });
        } else {
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ JSON data loaded:', jsonData);
                
              
                res.render('allData', { 
                    title: 'All Property Data', 
                    listings: jsonData,
                    count: jsonData.length 
                });
                
            } catch (parseErr) {
                console.error('Invalid JSON:', parseErr.message);
              
                res.status(500).render('error', { title: 'Error', message: 'Invalid JSON format' });
            }
        }
    });

});

// Single Listing Detail Route (Converted to use res.render('detail'))
app.get('/data/:index', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON:', err.message);
            return res.status(500).render('error', { title: 'Error', message: 'Error loading JSON file' });
        }

        try {
            const jsonData = JSON.parse(data);
            const index = parseInt(req.params.index, 10);
            const listing = jsonData[index];

            if (isNaN(index) || index < 0 || index >= jsonData.length) {
                 // CONVERTED to res.render('error')
                return res.status(404).render('error', { title: 'Error', message: `Invalid index value: ${index}` });
            }

            // CONVERTED to res.render('detail')
            res.render('detail', { 
                title: `Listing Detail: ${listing.name || listing.id}`, 
                listing: listing,
                index: index 
            });

        } catch (parseErr) {
            console.error('Invalid JSON:', parseErr.message);
             // CONVERTED to res.render('error')
            res.status(500).render('error', { title: 'Error', message: 'Invalid JSON format' });
        }
    });
});


// Search by ID Route (with express-validator)
app.get('/search/id', 
  [
    // Validation + Sanitization
    query('id')
      .optional({ checkFalsy: true }) // allow empty query so form loads
      .notEmpty().withMessage('Property ID is required.')
      .trim()
      .escape()
      .isNumeric().withMessage('Property ID must be a numeric value.')
      .toInt()
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If no ID is provided, show the search form only
    if (!req.query.id) {
      return res.render('searchId', { title: 'Search by ID' });
    }

    // If there are validation errors
    if (!errors.isEmpty()) {
      return res.render('searchId', {
        title: 'Search by ID',
        errorMessage: errors.array()[0].msg,
        searchId: req.query.id
      });
    }

    const searchId = req.query.id;

    fs.readFile(dataPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON:', err.message);
        return res.status(500).render('error', { title: 'Error', message: 'Error loading JSON data' });
      }

      try {
        const jsonData = JSON.parse(data);
        const property = jsonData.find(item => item.id == searchId);

        res.render('searchId', {
          title: 'Search by ID Results',
          searchId: searchId,
          property: property,
          errorMessage: property ? null : `Error: Property with ID ${searchId} not found!`
        });
      } catch (parseErr) {
        console.error('Invalid JSON:', parseErr.message);
        res.status(500).render('error', { title: 'Error', message: 'Invalid JSON format' });
      }
    });
  }
);
// Search by Name Route (with express-validator)
app.get('/search/name', 
  [
    // Validation + Sanitization
    query('name')
      .optional({ checkFalsy: true }) // allow page load with empty field
      .notEmpty().withMessage('Property name is required.')
      .trim()
      .escape() // sanitize to prevent HTML/script injection
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If no name query provided, show the form only
    if (!req.query.name) {
      return res.render('searchName', { title: 'Search by Name' });
    }

    // If there are validation errors
    if (!errors.isEmpty()) {
      return res.render('searchName', {
        title: 'Search by Name',
        errorMessage: errors.array()[0].msg,
        searchName: req.query.name
      });
    }

    const searchName = req.query.name;

    fs.readFile(dataPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON:', err.message);
        return res.status(500).render('error', { title: 'Error', message: 'Error loading JSON data' });
      }

      try {
        const jsonData = JSON.parse(data);

        // Perform case-insensitive match
       const matches = jsonData.filter(item =>
  item.NAME && item.NAME.toLowerCase().includes(searchName.toLowerCase())
);

        res.render('searchName', {
          title: `Search Results for "${searchName}"`,
          searchName: searchName,
          results: matches,
          errorMessage: matches.length === 0 ? `Error: No properties found containing "${searchName}"!` : null
        });
      } catch (parseErr) {
        console.error('Invalid JSON:', parseErr.message);
        res.status(500).render('error', { title: 'Error', message: 'Invalid JSON format' });
      }
    });
  }
);

app.get('/viewData', (req, res) => {
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err.message);
      return res.status(500).render('error', { title: 'Error', message: 'Error loading JSON data' });
    }

    try {
      const jsonData = JSON.parse(data);

      res.render('viewData', {
        title: 'Airbnb Listings Table',
        listings: jsonData,
        count: jsonData.length
      });
    } catch (parseErr) {
      console.error('Invalid JSON:', parseErr.message);
      res.status(500).render('error', { title: 'Error', message: 'Invalid JSON format' });
    }
  });
});

app.get('/viewData/price', 
  [
    query('min')
      .trim()
      .escape()
      .notEmpty().withMessage('Minimum price is required')
      .isNumeric().withMessage('Minimum price must be a number')
      .toFloat(),
    query('max')
      .trim()
      .escape()
      .notEmpty().withMessage('Maximum price is required')
      .isNumeric().withMessage('Maximum price must be a number')
      .toFloat()
  ],
  (req, res) => {
    const errors = validationResult(req);

    // If no query params, show the form only
    if (!req.query.min && !req.query.max) {
      return res.render('viewDataPriceForm', { title: 'Filter Properties by Price' });
    }

    // If validation errors exist
    if (!errors.isEmpty()) {
      return res.render('viewDataPriceForm', {
        title: 'Filter Properties by Price',
        errorMessage: errors.array()[0].msg,
        min: req.query.min,
        max: req.query.max
      });
    }

    const minPrice = req.query.min;
    const maxPrice = req.query.max;

    // Read JSON data
    fs.readFile(dataPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON:', err.message);
        return res.status(500).render('error', { title: 'Error', message: 'Error loading JSON data' });
      }

      try {
        const jsonData = JSON.parse(data);

        // Filter listings within price range
        const matches = jsonData.filter(item => {
          // Remove $ and spaces from price string, convert to float
          const priceNum = parseFloat(item.price.replace(/[^0-9.-]+/g,""));
          return priceNum >= minPrice && priceNum <= maxPrice;
        });

        res.render('viewDataPriceResults', {
          title: `Properties Between $${minPrice} and $${maxPrice}`,
          listings: matches,
          count: matches.length,
          minPrice,
          maxPrice
        });

      } catch (parseErr) {
        console.error('Invalid JSON:', parseErr.message);
        res.status(500).render('error', { title: 'Error', message: 'Invalid JSON format' });
      }
    });
  }
);

app.get('/users', function(req, res) {
res.render('users', {title:'User List', userCount:5});
});
app.use((req, res) => {
    res.status(404).render('error', { title: 'Error', message: 'Wrong Route' });
});
app.listen(port, () => {
console.log(`Example app listening at http://localhost:${port}`)
})