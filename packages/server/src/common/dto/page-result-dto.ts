import { ApiProperty } from '@nestjs/swagger'

export class PageResultDto<T> {
  @ApiProperty({
    description: '列表数据',
  })
  items?: T[]

  @ApiProperty({
    description: '总数',
  })
  total?: number

  @ApiProperty({
    description: '当前页',
  })
  page?: number

  @ApiProperty({
    description: '当前页记录数',
  })
  pageSize?: number
}
