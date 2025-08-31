# CMS Application with Docker

This project contains a CMS application consisting of a frontend and a backend, both of which are containerized using Docker.

## Project Structure

- **frontend/**: Contains the frontend application files.
  - **Dockerfile**: Instructions to build the Docker image for the frontend.
  - **nginx.conf**: Configuration for the Nginx server serving the frontend.
  - **.dockerignore**: Files and directories to ignore when building the frontend Docker image.

- **backend/**: Contains the backend application files.
  - **Dockerfile**: Instructions to build the Docker image for the backend.
  - **.dockerignore**: Files and directories to ignore when building the backend Docker image.

- **docker-compose.yml**: Defines the services, networks, and volumes for the application.

- **.env**: Contains environment variables used by the application.

## Getting Started

To build and run the application using Docker, follow these steps:

1. Ensure you have Docker and Docker Compose installed on your machine.
2. Clone this repository to your local machine.
3. Navigate to the project directory.
4. Run the following command to build and start the containers:

   ```bash
   docker-compose up --build
   ```

5. Access the frontend application at `http://localhost:3000` and the backend API at `http://localhost:5000`.

## Environment Variables

Make sure to configure the `.env` file with the necessary environment variables for your application.

## License

This project is licensed under the MIT License.