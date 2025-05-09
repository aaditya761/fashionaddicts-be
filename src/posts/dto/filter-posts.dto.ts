import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export enum FilterType {
  RECENT = 'recent',
  POPULAR = 'popular',
  TRENDING = 'trending',
}

export class FilterPostsDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter type',
    enum: FilterType,
    default: FilterType.RECENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(FilterType)
  filter?: FilterType = FilterType.RECENT;
}
