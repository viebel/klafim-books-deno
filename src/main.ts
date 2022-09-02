import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";

// Get the connection string from the environment variable "DATABASE_URL"
const databaseUrl = Deno.env.get("DATABASE_URL")!;

// Create a database pool with three connections that are lazily established
const pool = new postgres.Pool(databaseUrl, 3, true);

interface Book {
  isbn: string;
  title: string;
  publication_year: number;
}

async function getBooks() {
  // Grab a connection from the database pool
  const connection = await pool.connect();

  try {
    // Run the SQL query
    const result = await connection.queryObject<Book>`
          SELECT isbn, title, publication_year FROM books
        `;

    // Return the result as JSON
    return new Response(JSON.stringify(result.rows, null, 2), {
      headers: { "content-type": "application/json" },
    });
  }
  finally {
    // Release the connection back into the pool
    connection.release();
  }
}


serve(async (req: Request) => {
  // Parse the URL and check that the requested endpoint is /.
  //  If it is not, return a 404 response.
  const url = new URL(req.url);
  if (url.pathname !== "/") {
    return new Response("Not Found", { status: 404 });
  }



  try {
    switch (req.method) {
      case "GET": { // This is a GET request. Return a list of all books.
        return getBooks();
      }
      default: // If this is not a GET return a 405 response.
        return new Response("Method Not Allowed", { status: 405 });
    }
  } catch (err) {
    console.error(err);
    // If an error occurs, return a 500 response
    return new Response(`Internal Server Error\n\n${err.message}`, {
      status: 500,
    });
  }
});
