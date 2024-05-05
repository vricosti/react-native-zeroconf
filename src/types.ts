// export interface ZeroconfService {
//     name: string;
//     // Add other relevant properties of a service here
//     type?: string;
//     protocol?: string;
//     domain?: string;
//     port?: number;
//     txt?: Record<string, string>;
// }

export interface ZeroconfServices {
    [serviceName: string]: any;
}