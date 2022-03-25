import { ApiPropertyOptional } from '@nestjs/swagger'

export class QueryForm {
  @ApiPropertyOptional({ description: '当前页' })
  page?: number

  @ApiPropertyOptional({ description: '每页显示条数' })
  pageSize?: number

  @ApiPropertyOptional({ description: '是否分页,默认true' })
  isPage?: string

  @ApiPropertyOptional({ description: '排序,DESC降序,ASC升序,默认DESC' })
  order?: 'DESC' | 'ASC'

  @ApiPropertyOptional({ description: '排序字段,默认createdAt' })
  orderField?: string

  @ApiPropertyOptional({ description: '自定义sql拼接' })
  customSql?: string

  @ApiPropertyOptional({ description: '自定义sql拼接参数' })
  customParams?: any

  @ApiPropertyOptional({ description: '状态, 1-正常|2-已禁用' })
  status?: number

  @ApiPropertyOptional({ description: '是否需要关联表' })
  isRelate?: boolean

  @ApiPropertyOptional({ description: '关联条件' })
  relateParams?: Array<{ [key: string]: any }>
}
