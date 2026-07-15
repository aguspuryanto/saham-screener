## Trade Journal (`/api/journal`)

`api/journal.js` handles `GET`/`POST /api/journal` in production (mirrors `server/tradeJournalRoutes.js`
used locally). Since Vercel functions have no persistent disk, it stores entries in Turso (libSQL)
instead of the local `better-sqlite3` file. Requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
env vars set in the Vercel project (Production + Preview) — see `api/_lib/turso.js`.

## Api Daily Closing Price: 
```
https://pasardana.id/api/StockData/GetStockDailyClosingPrice?code=ADES&username=anonymous
```

## Result:
```
[
  {
    "Date": "2025-07-14T00:00:00",
    "Close": 13200.0,
    "Open": 12825.0,
    "High": 13250.0,
    "Low": 12325.0,
    "Return": 0.02923977,
    "Volume": 79100.0
  },
  {
    "Date": "2025-07-15T00:00:00",
    "Close": 12725.0,
    "Open": 13200.0,
    "High": 13450.0,
    "Low": 12625.0,
    "Return": -0.03598485,
    "Volume": 53000.0
  }
]
```

## Api Stock By Code:
```
https://pasardana.id/api/Stock/GetByCode?code=ADES&username=anonymous
```
Result:
```
{
  "Id": 8,
  "Code": "ADES",
  "Name": "Akasha Wira International Tbk.",
  "NewSectorName": "Barang Konsumen Primer",
  "NewSubSectorName": "Makanan & Minuman",
  "NewIndustryName": "Minuman",
  "NewSubIndustryName": "Minuman Ringan",
  "SectorName": "CONSUMER GOODS INDUSTRY",
  "SubSectorName": "Food & Beverages",
  "BoardRecording": 2,
  "HeadOffice": "Jakarta",
  "Phone": "081119345000",
  "RepresentativeName": "Thomas Maria Wisnu Adjie // corporate.secretary@adeswaters.co.id;Wisnu.Adji@adeswaters.co.id\t// 021-27545000",
  "WebsiteUrl": "www.akashainternational.com",
  "Address": "Jl. TB.Simatupang Kav. 89 RT 01 RW 02, Kelurahan Tanjung Barat, Kecamatan Jagakarsa, Jakarta Selatan - 12530",
  "TotalEmployees": null,
  "ExchangeAdministration": "PT. Raya Saham Registra",
  "Npwp": "01.371.491.0-054.000",
  "Npkp": null,
  "IsActive": true,
  "ListingDate": "1994-06-13",
  "AnnualDividend": 0.0,
  "GeneralInformation": "PT Akasha Wira International Tbk Tbk (IDX: ADES), merupakan perusahaan yang memiliki Bidang Usaha Utama berupa Minuman dan Makanan Ringan. Emiten sektor Barang Konsumen Primer ini beralamat kantor di Perkantoran Hijau Arkadia Tower C Lantai 15 Jl. TB. Simatupang Kav. 88 Jakarta 12520. Listing di BEI pada tanggal 13 Juni 1994. Adapun perusahaan memiliki anak usaha yaitu PT. Akasha Wira International Tbk yang bergerak di Industri Barang Konsumsi.",
  "Fax": "-",
  "FoundingDate": "1985-06-03",
  "CompanyEmail": "corporate.secretary@akashainternational.com",
  "fkNewSectorId": 4,
  "fkNewSubSectorId": 8,
  "fkNewIndustryId": 20,
  "fkNewSubIndustryId": 43,
  "fkStockSectorId": 4,
  "fkStockSubSectorId": 51,
  "CorporateActions": [
    {
      "Id": 3908,
      "IdxId": 5268,
      "Date": "1994-06-11T00:00:00",
      "Type": "hmetd",
      "StockCode": "ADES",
      "fkStockId": 8,
      "Stock": null,
      "TotalCorporateAction": 73720000.0,
      "TotalValue": 73720000.0
    },
    {
      "Id": 3905,
      "IdxId": 5269,
      "Date": "1994-06-13T00:00:00",
      "Type": "CompanyListing",
      "StockCode": "ADES",
      "fkStockId": 8,
      "Stock": null,
      "TotalCorporateAction": 23000000.0,
      "TotalValue": 111720000.0
    },
    {
      "Id": 3906,
      "IdxId": 5270,
      "Date": "1994-06-13T00:00:00",
      "Type": "ipo",
      "StockCode": "ADES",
      "fkStockId": 8,
      "Stock": null,
      "TotalCorporateAction": 15000000.0,
      "TotalValue": 88720000.0
    },
    {
      "Id": 3535,
      "IdxId": 5271,
      "Date": "1997-08-07T00:00:00",
      "Type": "sahamBonus",
      "StockCode": "ADES",
      "fkStockId": 8,
      "Stock": null,
      "TotalCorporateAction": 38000000.0,
      "TotalValue": 149720000.0
    },
    {
      "Id": 2586,
      "IdxId": 5272,
      "Date": "2007-12-28T00:00:00",
      "Type": "hmetd",
      "StockCode": "ADES",
      "fkStockId": 8,
      "Stock": null,
      "TotalCorporateAction": 440176800.0,
      "TotalValue": 589896800.0
    }
  ],
  "LastData": {
    "Code": "ADES",
    "AdjustedClosingPrice": 34925.0,
    "AdjustedOpenPrice": 35300.0,
    "AdjustedHighPrice": 35300.0,
    "AdjustedLowPrice": 34375.0,
    "Per": 24.21224000,
    "Pbr": 6.32699000,
    "OneDay": -0.01132343,
    "OneWeek": 0.04487659,
    "OneMonth": 0.5875,
    "ThreeMonth": 1.11346445,
    "SixMonth": 1.27895595,
    "OneYear": 1.64583333,
    "ThreeYear": 2.4925,
    "FiveYear": 13.43181818,
    "TenYear": 25.66030534,
    "Mtd": 0.07710100,
    "Ytd": 1.26418152,
    "StanDev14": 0.40324000,
    "StanDev25": 0.8267,
    "StanDev75": 0.66772000,
    "TopBand14Days": 61731.51591000,
    "TopBand25Days": 88097.1068,
    "TopBand75Days": 60578.19076000,
    "LowerBand14Days": 6612.92854000,
    "LowerBand25Days": -21694.16562000,
    "LowerBand75Days": -8701.01685000,
    "MovingAverage14Days": 34172.22222000,
    "MovingAverage25Days": 33201.47059000,
    "MovingAverage75Days": 25938.58696000,
    "Rsi14Days": 73.3871,
    "Rsi25Days": 78.21637000,
    "Rsi75Days": 73.46939000,
    "Beta14Days": null,
    "Beta25Days": null,
    "Beta75Days": null,
    "BetaOneYear": 0.18916298,
    "BetaThreeYear": 0.31856916,
    "BetaFiveYear": 0.35774925,
    "StdevOneYear": 0.42480514,
    "StdevThreeYear": 0.39239850,
    "StdevFiveYear": 0.41725818,
    "CorrOneYear": 0.11205578,
    "CorrThreeYear": 0.15935356,
    "CorrFiveYear": 0.14590628,
    "Value": 1457067500.0,
    "Volume": 42100.0,
    "Frequency": 202.0,
    "Capitalization": 20602145740000.0,
    "AdjustedAnnualHighPrice": 37200.0,
    "AdjustedAnnualLowPrice": 12325.0,
    "Date": "2026-07-14T00:00:00",
    "DateModified": "2026-07-14T16:00:00",
    "DateBased": "2026-07-14T00:00:00"
  },
  "PreviousData": {
    "Id": 0,
    "Date": "2026-07-13T00:00:00",
    "ClosingPrice": 35325.0,
    "Return": null
  },
  "YearToDateHigh": {
    "Id": 0,
    "Date": "2026-07-09T00:00:00",
    "ClosingPrice": 35625.0,
    "Return": null
  },
  "YearToDateLow": {
    "Id": 0,
    "Date": "2026-03-09T00:00:00",
    "ClosingPrice": 14750.0,
    "Return": null
  }
}
```

## Api Stock Profile:
```
https://pasardana.id/api/StockProfile/GetProfileByCode?code=ADES
```
Result:
```
{
  "Audits": [
    {
      "Id": 631,
      "FkProfileId": 7,
      "Name": "Hastuti",
      "Role": "ANGGOTA"
    }
  ],
  "cashdividend": [],
  "Commisioners": [
    {
      "Id": 729,
      "FkProfileId": 7,
      "Name": "Julianto",
      "Role": "KOMISARIS",
      "Independent": "Ya"
    },
    {
      "Id": 727,
      "FkProfileId": 7,
      "Name": "Hanjaya Limanto",
      "Role": "KOMISARIS UTAMA",
      "Independent": "Tidak"
    },
    {
      "Id": 728,
      "FkProfileId": 7,
      "Name": "Rudy Hidayat",
      "Role": "KOMISARIS",
      "Independent": "Tidak"
    }
  ],
  "CompanyChilds": [],
  "Directors": [
    {
      "Id": 824,
      "FkProfileId": 7,
      "Name": "Fany Soegiarto",
      "Role": "PRESIDEN DIREKTUR",
      "Affiliated": "Ya"
    },
    {
      "Id": 825,
      "FkProfileId": 7,
      "Name": "Hagi Yufantra",
      "Role": "DIREKTUR",
      "Affiliated": "Ya"
    }
  ],
  "listinghistory": [],
  "Secretaries": [
    {
      "Id": 210,
      "FkProfileId": 7,
      "Name": "Aprianti Kartika",
      "Email": "aprianti.kartika@akashainternational.com",
      "PhoneNumber": "021-27545000 "
    }
  ],
  "StockHolders": [
    {
      "Id": 1808,
      "FkProfileId": 7,
      "Name": "Hagi Yufantra",
      "HoldingType": "Direksi",
      "Amount": "2.453.400",
      "Percentage": "0.416"
    },
    {
      "Id": 1803,
      "FkProfileId": 7,
      "Name": "Water Partners Bottling, SA",
      "HoldingType": "Lebih dari 5%",
      "Amount": "538.896.713",
      "Percentage": "91.3544"
    },
    {
      "Id": 1804,
      "FkProfileId": 7,
      "Name": "Saham Treasury",
      "HoldingType": "Saham Treasury",
      "Amount": "0",
      "Percentage": "0"
    },
    {
      "Id": 1805,
      "FkProfileId": 7,
      "Name": "Masyarakat Warkat",
      "HoldingType": "Masyarakat Warkat",
      "Amount": "688.428",
      "Percentage": "0.1167"
    },
    {
      "Id": 1806,
      "FkProfileId": 7,
      "Name": "Masyarakat Non Warkat",
      "HoldingType": "Masyarakat Non Warkat",
      "Amount": "47.850.359",
      "Percentage": "8.1116"
    },
    {
      "Id": 1807,
      "FkProfileId": 7,
      "Name": "Fany Soegiarto",
      "HoldingType": "Direksi",
      "Amount": "7.900",
      "Percentage": "0.0013"
    }
  ],
  "StockCode": "ADES",
  "Date": "2016-03-24T00:00:00",
  "StockName": "Akasha Wira International Tbk, PT",
  "Address": [],
  "BusinessSector": "Drinking water bottling and distribution company",
  "SectorCode": "51",
  "SectorName": "Food and Beverages",
  "Status": "PMDN",
  "FoundedDate": "1985",
  "StockStatus": "Active",
  "BriefStory": null,
  "shareholder": null,
  "fkFinancialstatementId": 7,
  "Financialstatement": {
    "FiscalYearEnds": "December",
    "DateOfStatement": "2016-06-30",
    "Currency": "IDR",
    "Range": 1.0,
    "Cashnequivalent": 16849000000.0,
    "CurrAsset": 274187000000.0,
    "FixedAsset": 339335000000.0,
    "TotalAsset": 613522000000.0,
    "CurrliAbilities": 197893000000.0,
    "LongtermDebt": 102816000000.0,
    "MinInterest": 0.0,
    "TotalLiab": 300709000000.0,
    "Paidupcap": 589896800.0,
    "TotEquity": 312813000000.0,
    "TotSales": 479476000000.0,
    "GrossProfit": 231066000000.0,
    "OperateProfit": 22630000000.0,
    "NetIncome": 17014000000.0,
    "CashPptAct": 0.0,
    "CashInvAct": -31673000000.0,
    "CashFinAct": -31673000000.0,
    "Eps": 7.5786,
    "BookValue": 59.4500,
    "Der": 0.9600,
    "Roa": 0.0370,
    "Roe": 0.0725,
    "Npm": 0.0400,
    "Opm": 0.0500,
    "SalesPct": 28.2800,
    "NetIncomePct": -10.5900,
    "TotAssetPct": 25.3300,
    "TotalLiabilitiesPct": 38.2900,
    "Id": 7,
    "DateCreated": "2016-03-24T16:05:13.550835",
    "DateModified": "2016-10-01T00:03:35.61214",
    "IsUpdateDate": true
  },
  "fkManagementId": 7,
  "Management": null,
  "Id": 7,
  "DateCreated": "2016-03-24T16:05:13.550835",
  "DateModified": "2016-10-01T00:03:35.61214",
  "IsUpdateDate": true
}
```