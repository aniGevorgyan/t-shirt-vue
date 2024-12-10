## Installation

Clone the project

```bash
git clone 
cd t-shirt
```

Create .env file

```bash
cp .env.example .env
# do not forget fill the file
```

Installation of dependencies

```bash
yarn install
yarn install:app
```
## Development

Start the backend

```bash
yarn dev:app
# App is available on address
# http://localhost:3040
```
## Environment Variables

Frontend .env variables

`VUE_APP_API_URL` - Address for API requests

## Deployment

Build frontend

```bash
yarn build
```