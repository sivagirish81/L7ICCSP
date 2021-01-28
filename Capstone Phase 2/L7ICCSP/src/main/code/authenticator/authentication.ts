// Interface for handling authentication to get access token
interface Authentication{
    auth(): string; // auth function to get login credentials and provide the access token
}