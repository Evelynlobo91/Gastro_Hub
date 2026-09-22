import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../contracts';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CreateBrandTransferDto } from './dto/create-brand-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { MarketplaceService } from './marketplace.service';

/**
 * Rotas do Marketplace Interno — transferência de insumos entre marcas
 * (issues #20/#23 — Fase 3).
 *
 * Todas as rotas requerem brand_admin ou platform_admin.
 */
@ApiBearerAuth()
@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  @Post('transfers')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Solicita transferência de insumo entre marcas (issue #20)' })
  requestTransfer(@Body() dto: CreateBrandTransferDto) {
    return this.marketplace.requestTransfer(dto);
  }

  @Get('transfers')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Lista transferências de uma marca (como origem ou destino)' })
  @ApiQuery({ name: 'brandId', required: true, description: 'UUID da marca' })
  listTransfers(@Query('brandId', ParseUUIDPipe) brandId: string) {
    return this.marketplace.listTransfers(brandId);
  }

  @Get('transfers/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Detalhe de uma transferência' })
  @ApiParam({ name: 'id', format: 'uuid' })
  getTransfer(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplace.getTransfer(id);
  }

  @Patch('transfers/:id/status')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Atualiza status da transferência (issue #23) — received aciona ACID de estoque',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransferStatusDto,
  ) {
    return this.marketplace.updateStatus(id, dto);
  }
}
