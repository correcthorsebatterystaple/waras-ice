# Waras ICS generator
This script takes in a csv with waras data and creates a .ics file that has the gregorian events for the corresponding waras events.

## Usage
Generate waras events from `assets/waras.csv` and give reference dates `2020-03-26` and `1441-08-02` for gregorian and hijri, respectively.
```
npm start -- --file assets/waras.csv --greg-ref 2020-03-26 --hijri-ref 1441-08-02
```