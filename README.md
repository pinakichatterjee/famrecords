# Famrecords

Create a medical document storage app for myself and my family

Auth page → Authentication - using lovable Auth → name, Email and 

password

Dashboard page branches into:

Members →

Able to add/edit/delete the family members

Show the list of family members in a table

Medical Records →

Able to upload a medical record in a pdf, doc or in a image format. It 

should be able to upload it from mobile phone using camera

Show the list of all medical records with a filter by family members 

and the ability to search by medical records name

Settings →

ability to change the email

Create a lovable database

user (email, name)

family_member (user_id, member_name, height, weight, relation, 

blood group)

medical_records (created_by (user table),

Create a lovable database

user (email, name)

family_member (user_id, member_name, height, weight, relation, 

blood groupmedical_records (created_by (user table), family_member_id, name, 

document)

The document from the medical_records should be stored in the 

Lovable app storage.

Database Requirements

The application requires a Lovable database with the following 

structure:

User Table: Fields for email and name.

Family Member Table: Fields for user_id, member_name, height, 

weight, relation, and blood group.

Medical Records Table: Fields for created_by (linked to user table), 

family_member_id, name, and document.

Storage Note: Documents from the medical_records table should be 

stored in the Replit app storage.

Design Principles

The user interface should adhere to these core principles:

Layout:

Use a centered, max-width container (approximately 1200px).

Implement a responsive grid layout using a combination of Flexbox 

and CSS Grid.

Maintain ample whitespace between sections.

Typography:

Heading font: Sans-serif, medium to bold weight, sized between text-

2xl and text-4xl.

Body font: Regular sans-serif, sized between text-base and text-lg.Establish a clear typographic hierarchy across headings, subheadings, 

and descriptions.

Spacing: Use consistent vertical padding and margins (e.g., py-8, my-

12, space-y-6) and standard component-level spacing.

Alignment: Text should be left-aligned for readability, while Call to 

Action (CTA) buttons should be centered.

· Color Palette

· Use a calming, health-centric color scheme with the following 

hex codes:

Element

Color Name

Hex Code

Usage

Primary

Primary Green

#10847E

Buttons, icons, and highlights

Secondary

Secondary Light Green

#DFF6F5

Background sections and cards

Accent

Accent Yellow

#F6C343

Highlights and promotional sections

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://famrecords.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/629567cf-1480-43c9-a311-4fa3eec6d641).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
