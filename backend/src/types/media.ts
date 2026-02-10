export interface Media {
  id: string;
  filename: string;
  url: string;
  mimetype?: string;
  size?: number;
  alt_text?: string;
  tags?: string[];
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MediaUploadRequest {
  file: Express.Multer.File;
  altText?: string;
  tags?: string[];
}

export interface MediaFilterOptions {
  page?: number;
  pageSize?: number;
  tags?: string[];
  search?: string;
}

export interface PaginatedMediaResponse {
  data: Media[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
