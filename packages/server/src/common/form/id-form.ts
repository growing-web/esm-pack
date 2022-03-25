import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class IdForm {
  @ApiProperty({ description: 'id' })
  @IsNotEmpty({ always: true, message: 'id不能为空！' })
  id?: number
}

export class IdListForm {
  @ApiProperty({ description: 'idList' })
  @IsNotEmpty({ always: true, message: 'idList不能为空！' })
  idList?: string[]
}
