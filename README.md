# Dienstbefreiung – independent SharePoint form

This form is intentionally independent from Notfallkontakte.

## Files

```text
app/
└── dienstbefreiung/
    ├── page.tsx
    ├── actions.ts
    ├── DienstbefreiungForm.tsx
    └── dienstbefreiung.module.css

lib/
└── dienstbefreiung-sp.ts

types/
└── dienstbefreiung.ts
```

The only shared authentication dependency is the existing:

```text
lib/authenticatedIdentity.ts
```

## No Notfallkontakte dependency

This implementation does not import the existing Notfallkontakte `sp.ts`.

It does not read from or write to the Notfallkontakte list.

The new SharePoint destination is:

```env
SHAREPOINT_DIENSTBEFREIUNG_LIST_ID=...
```

The employee lookup uses:

```env
SHAREPOINT_USER_DIRECTORY_LIST_ID=...
```

## Required SharePoint columns

Create a separate Dienstbefreiung list with these internal names:

```text
WFVorname
WFName
WFOrganisationseinheit
WFUserID

DB_Dienstgrad
DB_AnlassDisziplin
DB_AndererAnlass
DB_AnlassVon
DB_AnlassBis

DB_Dienstbefreiung1
DB_Dienstbefreiung2
DB_Dienstbefreiung3

DB_Dienst
DB_AndererDienst

DB_AntragstellerBemerkungen

DB_DienstVorangehendeStufe1
DB_DienstVorangehendeStufe1Bemerkung

DB_DienstVorangehendeStufe2
DB_DienstVorangehendeStufe2Bemerkung

DB_BegruendungSportler
DB_StatusTest
DB_Anhaenge
```

The four employee fields are resolved on the server from the authenticated
user directory. They are displayed read-only and are also resolved again
during save.

## Environment

Copy the values from `.env.dienstbefreiung.example` into the project's
environment configuration.

Do not commit NTLM credentials.

## Route

The page is:

```text
/dienstbefreiung
```

## Attachments

`DB_Anhaenge` is currently represented as a text field.

If the final requirement is a real SharePoint file attachment upload, that
needs a separate SharePoint attachment implementation.

## Dienstgrad

Dienstgrad is editable because the supplied user-directory model did not
contain an authoritative Dienstgrad field.
