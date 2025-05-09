import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('comments')
export class Comment extends BaseEntity {
  @ApiProperty({ description: 'Comment text' })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ description: 'Comment author' })
  @ManyToOne(() => User, (user) => user.comments, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ApiProperty({ description: 'Post being commented on' })
  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: number;
}
