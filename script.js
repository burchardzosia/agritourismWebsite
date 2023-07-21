import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.pretty = app.get('env') === 'development';

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const uri = "mongodb+srv://zosia:zosia@cluster0.qztkd5n.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
let collection;

async function run() {
  try {
    await client.connect();
    const db = client.db("AGH");
    collection = db.collection("page");

    app.get('/', function (request, response) {
      response.render('index');
    });

    app.post('/submit', function (request, response) {
      const nowyStudent = {
        imieNazwisko: request.body.name,
        rodzajPokoju: request.body.roomType,
        typPokoju: request.body.roomOption,
        dataPoczatkowa: request.body.checkIn,
        dataKoncowa: request.body.checkOut
      };
    
      const query = {
        rodzajPokoju: request.body.roomType,
        typPokoju: request.body.roomOption,
        $or: [
          { dataPoczatkowa: { $gte: request.body.checkIn, $lte: request.body.checkOut } },
          { dataKoncowa: { $gte: request.body.checkIn, $lte: request.body.checkOut } },
        ],
      };
    
      collection.findOne(query)
        .then((existingReservation) => {
          if (existingReservation) {
            console.log('Rezerwacja w tym przedziale czasowym już istnieje');
            response.redirect('/');
          } else {
            collection.insertOne(nowyStudent)
              .then(() => {
                console.log('Dodano nową rezerwację');
                response.redirect('/');
              })
              .catch((error) => {
                console.error('Błąd podczas dodawania studenta:', error);
                response.redirect('/');
              });
          }
        })
        .catch((error) => {
          console.error('Błąd podczas wyszukiwania rezerwacji:', error);
          response.redirect('/');
        });
    });

    app.listen(8000, function () {
      console.log('Serwer został uruchomiony na porcie 8000');
      console.log('Aby zatrzymać serwer, naciśnij "CTRL + C"');
    });
  } catch (error) {
    console.error("Błąd podczas łączenia z bazą danych:", error);
  }
}

run();