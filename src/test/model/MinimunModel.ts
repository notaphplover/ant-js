import { Model } from '../../model/Model';

export class MinimunModel extends Model {
  public constructor() {
    super('id', ['id', 'noId']);
  }
}
