import type { GetFileResponse } from '@figma/rest-api-spec';

export class FigmaApiClient {
  private apiKey: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFile(fileKey: string): Promise<GetFileResponse> {
    const url = `${this.baseUrl}/files/${fileKey}`;
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    return response.json() as Promise<GetFileResponse>;
  }

  async getImages(fileKey: string, nodeIds: string[]): Promise<Record<string, string>> {
    const ids = nodeIds.join(',');
    const url = `${this.baseUrl}/images/${fileKey}?ids=${ids}&format=png&scale=2`;
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.statusText}`);
    }

    const data = await response.json() as { images?: Record<string, string> };
    return data.images || {};
  }
}