import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto, UpdateMemberDto, BulkCreateMembersDto } from './dto/member.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.member.findMany({
      where: { orgId },
      include: { _count: { select: { contributions: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const member = await this.prisma.member.findFirst({ where: { id, orgId } });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async create(orgId: string, dto: CreateMemberDto) {
    return this.prisma.member.create({ data: { orgId, ...dto } });
  }

  /** Bulk "import a list of member names" — used when onboarding an existing roster. */
  async bulkCreate(orgId: string, dto: BulkCreateMembersDto) {
    const names = dto.names.map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) throw new ConflictException('No member names provided');
    await this.prisma.member.createMany({ data: names.map((name) => ({ orgId, name })) });
    return this.findAll(orgId);
  }

  async update(id: string, orgId: string, dto: UpdateMemberDto) {
    await this.findOne(id, orgId);
    return this.prisma.member.update({ where: { id }, data: dto });
  }

  async delete(id: string, orgId: string) {
    await this.findOne(id, orgId);
    // Contributions (Receipt.memberId) are kept for audit history — only the
    // roster entry is removed, same "deactivate don't destroy" posture as
    // collectors/areas elsewhere in the app. If they were ever contributed
    // for, soft-deactivate instead of hard-deleting so history stays intact.
    const hasContributions = await this.prisma.receipt.count({ where: { memberId: id } });
    if (hasContributions > 0) {
      return this.prisma.member.update({ where: { id }, data: { isActive: false } });
    }
    return this.prisma.member.delete({ where: { id } });
  }
}
