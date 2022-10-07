import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";

// Get the connection string from the environment variable "DATABASE_URL"
const databaseUrl = Deno.env.get("DATABASE_URL")!;

// Create a database client
const client = new postgres.Client(databaseUrl);

interface Book {
  isbn: string;
  title: string;
  publication_year: number;
}

async function getBooks() {
  // Run the SQL query
  const result = await client.queryObject<Book>`
          SELECT isbn, title, publication_year FROM books
        `;

  // Return the result as JSON
  return new Response(JSON.stringify(result.rows, null, 2), {
    headers: { "content-type": "application/json" },
  });

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
