import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Vote } from '../../votes/entities/vote.entity';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ description: 'Username' })
  @Column({ unique: true })
  username: string;

  @ApiProperty({ description: 'Email address' })
  @Column({ unique: true })
  email: string;

  @ApiHideProperty()
  @Exclude()
  @Column()
  password: string;

  @ApiProperty({ description: 'Profile description', nullable: true })
  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @ApiProperty({ description: 'Profile picture URL', nullable: true })
  @Column({ nullable: true })
  profilePicture?: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];
}
